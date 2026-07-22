import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const designRoot = path.join(repoRoot, "design/claude-design");
const resourcesRoot = path.join(repoRoot, "cocos/assets/resources");
const manifestPath = path.join(designRoot, "motion-asset-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const failures = [];

if (manifest.version !== 1) {
  failures.push("motion manifest version must be 1");
}
if (manifest.designTool !== "Claude Design") {
  failures.push("motion manifest designTool must be Claude Design");
}
if (!Array.isArray(manifest.sets) || manifest.sets.length === 0) {
  failures.push("motion manifest sets must be a non-empty array");
}

const motionAssetIds = new Set();
const entityIds = new Set();
for (const set of manifest.sets ?? []) {
  validateSet(set);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${manifest.sets.length} motion asset sets`);

function validateSet(set) {
  const label = set.motionAssetId ?? "unknown_motion_set";
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(label)) {
    failures.push(`${label} motionAssetId must be lowercase snake case`);
  }
  if (motionAssetIds.has(label)) {
    failures.push(`${label} motionAssetId is duplicated`);
  }
  motionAssetIds.add(label);
  if (!set.entityId || entityIds.has(set.entityId)) {
    failures.push(`${label} entityId must be present and unique`);
  }
  entityIds.add(set.entityId);
  if (!Array.isArray(set.frameFiles) || set.frameFiles.length < 2) {
    failures.push(`${label} must contain at least two frame files`);
    return;
  }
  if (!Number.isFinite(set.framesPerSecond) || set.framesPerSecond <= 0) {
    failures.push(`${label} framesPerSecond must be positive`);
  }
  if (set.loop !== true) {
    failures.push(`${label} must be authored as a loop`);
  }

  const sourceDirectory = path.join(designRoot, set.sourceDirectory ?? "");
  const runtimeDirectory = path.join(resourcesRoot, set.runtimeDirectory ?? "");
  const frameAnalyses = [];
  for (const frameFile of set.frameFiles) {
    if (!/^frame_[0-9]{2}\.png$/.test(frameFile)) {
      failures.push(`${label} has invalid frame file name: ${frameFile}`);
      continue;
    }
    const sourcePath = path.join(sourceDirectory, frameFile);
    const runtimePath = path.join(runtimeDirectory, frameFile);
    if (!fs.existsSync(sourcePath)) {
      failures.push(`${label} source frame is missing: ${frameFile}`);
      continue;
    }
    if (!fs.existsSync(runtimePath)) {
      failures.push(`${label} runtime frame is missing: ${frameFile}`);
      continue;
    }
    if (sha256(sourcePath) !== sha256(runtimePath)) {
      failures.push(`${label} runtime frame differs from source: ${frameFile}`);
    }
    try {
      frameAnalyses.push(analyzeRgbaPng(runtimePath));
    } catch (error) {
      failures.push(`${label} ${frameFile}: ${error.message}`);
    }
  }

  for (const analysis of frameAnalyses) {
    if (
      analysis.width !== set.canvasSize?.width ||
      analysis.height !== set.canvasSize?.height
    ) {
      failures.push(
        `${label} frame dimensions must be ${set.canvasSize?.width}x${set.canvasSize?.height}`,
      );
    }
    if (!analysis.hasTransparentPixel || !analysis.hasVisiblePixel) {
      failures.push(`${label} frames must contain visible pixels and transparency`);
    }
    const bottomPixelY = analysis.alphaBounds?.bottom ?? -1;
    if (
      Math.abs(bottomPixelY - set.stableBaselineY) >
      (set.baselineTolerancePixels ?? 0)
    ) {
      failures.push(
        `${label} alpha baseline ${bottomPixelY} exceeds tolerance around ${set.stableBaselineY}`,
      );
    }
  }

  const frameZero = path.join(runtimeDirectory, set.frameFiles[0]);
  const reference = path.join(resourcesRoot, set.referenceRuntimeAsset ?? "");
  if (!fs.existsSync(reference)) {
    failures.push(`${label} reference runtime asset is missing`);
  } else if (fs.existsSync(frameZero) && sha256(frameZero) !== sha256(reference)) {
    failures.push(`${label} frame_00 must exactly match its static reference`);
  }
}

function analyzeRgbaPng(filePath) {
  const data = fs.readFileSync(filePath);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!data.subarray(0, 8).equals(signature)) {
    throw new Error("file is not a PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const compressed = [];
  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString("ascii", offset + 4, offset + 8);
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === "IDAT") {
      compressed.push(chunk);
    } else if (type === "IEND") {
      break;
    }
    offset += length + 12;
  }
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error("PNG must be non-interlaced 8-bit RGBA");
  }
  const inflated = zlib.inflateSync(Buffer.concat(compressed));
  const stride = width * 4;
  const previous = Buffer.alloc(stride);
  let sourceOffset = 0;
  let hasTransparentPixel = false;
  let hasVisiblePixel = false;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    const row = Buffer.from(inflated.subarray(sourceOffset, sourceOffset + stride));
    sourceOffset += stride;
    unfilterRow(row, previous, filter, 4);
    for (let x = 0; x < width; x += 1) {
      const alpha = row[x * 4 + 3];
      hasTransparentPixel ||= alpha < 255;
      hasVisiblePixel ||= alpha > 0;
      if (alpha > 0) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
    row.copy(previous);
  }
  return {
    width,
    height,
    hasTransparentPixel,
    hasVisiblePixel,
    alphaBounds:
      right >= 0 ? { left, top, right, bottom } : undefined,
  };
}

function unfilterRow(row, previous, filter, bytesPerPixel) {
  for (let index = 0; index < row.length; index += 1) {
    const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
    const up = previous[index];
    const upperLeft = index >= bytesPerPixel ? previous[index - bytesPerPixel] : 0;
    if (filter === 1) {
      row[index] = (row[index] + left) & 255;
    } else if (filter === 2) {
      row[index] = (row[index] + up) & 255;
    } else if (filter === 3) {
      row[index] = (row[index] + Math.floor((left + up) / 2)) & 255;
    } else if (filter === 4) {
      row[index] = (row[index] + paeth(left, up, upperLeft)) & 255;
    } else if (filter !== 0) {
      throw new Error(`unsupported PNG filter: ${filter}`);
    }
  }
}

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}
