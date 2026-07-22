import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRgbaPng, sha256 } from "./png-analysis.mjs";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const designRoot = path.join(repoRoot, "design/claude-design");
const resourcesRoot = path.join(repoRoot, "cocos/assets/resources");
const manifestPath = path.join(designRoot, "motion-asset-manifest.json");
const gameplayConfigPath = path.join(resourcesRoot, "config/demo-gameplay.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const gameplayConfig = JSON.parse(fs.readFileSync(gameplayConfigPath, "utf8"));
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
  validateRuntimeBinding(set, label);
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
  const analysesByFrameFile = new Map();
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
      const analysis = analyzeRgbaPng(runtimePath);
      frameAnalyses.push(analysis);
      analysesByFrameFile.set(frameFile, analysis);
    } catch (error) {
      failures.push(`${label} ${frameFile}: ${error.message}`);
    }
  }

  const playbackFrameFiles = set.playbackFrameFiles ?? set.frameFiles;
  for (const frameFile of playbackFrameFiles) {
    if (!set.frameFiles.includes(frameFile)) {
      failures.push(`${label} playback frame is not in frameFiles: ${frameFile}`);
    }
  }
  const referenceVisiblePixels = analysesByFrameFile.get(set.frameFiles[0])?.visiblePixelCount;
  for (const frameFile of playbackFrameFiles) {
    const visiblePixelCount = analysesByFrameFile.get(frameFile)?.visiblePixelCount;
    if (
      referenceVisiblePixels &&
      visiblePixelCount !== undefined &&
      visiblePixelCount / referenceVisiblePixels < 0.75
    ) {
      failures.push(
        `${label} playback frame ${frameFile} contains less than 75% of the reference subject`,
      );
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

function validateRuntimeBinding(set, label) {
  const entity = (gameplayConfig.sceneEntitySets ?? [])
    .flatMap((entitySet) => entitySet.entities ?? [])
    .find((candidate) => candidate.entityId === set.entityId);
  if (!entity) {
    failures.push(`${label} entity is missing from gameplay config`);
    return;
  }
  if (entity.motionProfileId !== set.motionProfileId) {
    failures.push(
      `${label} expected ${set.entityId} to use ${set.motionProfileId}, received ${entity.motionProfileId ?? "none"}`,
    );
    return;
  }
  const profile = (gameplayConfig.motionProfiles ?? []).find(
    (candidate) => candidate.motionProfileId === set.motionProfileId,
  );
  if (!profile) {
    failures.push(`${label} motion profile is missing: ${set.motionProfileId}`);
    return;
  }
  const expectedFrameAssets = (set.playbackFrameFiles ?? set.frameFiles).map(
    (frameFile) =>
      `${set.runtimeDirectory}/${frameFile.replace(/\.png$/, "")}`,
  );
  const matchingVariant = profile.idleVariants?.find(
    (variant) =>
      Array.isArray(variant.frameAssets) &&
      JSON.stringify(variant.frameAssets) === JSON.stringify(expectedFrameAssets),
  );
  if (!matchingVariant) {
    failures.push(
      `${label} profile ${set.motionProfileId} does not reference the manifest frame sequence`,
    );
  }
}
