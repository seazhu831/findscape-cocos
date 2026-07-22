import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRgbaPng, sha256 } from "./png-analysis.mjs";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const intakeRoot = path.join(
  repoRoot,
  "design/claude-design/intake/20260722-dense-region",
);
const handoffRoot = path.join(
  repoRoot,
  "design/claude-design/handoffs/stage-4g-dense-region-v1",
);
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const manifest = readJson(path.join(intakeRoot, "manifest.json"));
const template = readJson(path.join(handoffRoot, "manifest-template.json"));
const gameplayConfig = readJson(configPath);
const failures = [];

expectEqual("manifest version", manifest.version, 1);
expectEqual("batchId", manifest.batchId, "findscape_dense_region_batch_v1");
expectEqual("designTool", manifest.designTool, "Claude Design");
expectEqual("mapId", manifest.mapId, "demo_cozy_town");
expectJson("region", manifest.region, template.region);

for (const requiredFile of [
  "README.md",
  "decision_note.md",
  "contact_sheet.png",
  "region_composite_preview.png",
]) {
  if (!fs.existsSync(path.join(intakeRoot, requiredFile))) {
    failures.push(`missing required package file: ${requiredFile}`);
  }
}

validateReviewImage("region_composite_preview.png", 1000, 760, false);
validateReviewImage("contact_sheet.png", 1000, 700, true);

const templateById = new Map(
  template.assets.map((asset) => [asset.assetId, asset]),
);
const manifestById = new Map();
for (const asset of manifest.assets ?? []) {
  if (manifestById.has(asset.assetId)) {
    failures.push(`duplicate assetId: ${asset.assetId}`);
  }
  manifestById.set(asset.assetId, asset);
  validateAsset(asset, templateById.get(asset.assetId));
}
expectJson(
  "asset IDs",
  [...manifestById.keys()].sort(),
  [...templateById.keys()].sort(),
);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Validated ${manifest.assets.length} dense-region assets and 19 runtime PNGs`,
);

function validateAsset(asset, expected) {
  const label = asset.assetId ?? "unknown_asset";
  if (!expected) {
    failures.push(`${label} is not present in the handoff template`);
    return;
  }
  for (const field of [
    "kind",
    "layer",
    "renderOrder",
    "activationPolicy",
  ]) {
    expectEqual(`${label}.${field}`, asset[field], expected[field]);
  }
  expectJson(`${label}.canvasSize`, asset.canvasSize, expected.canvasSize);
  expectJson(`${label}.anchor`, asset.anchor, expected.anchor);
  const position = asset.mapPosition;
  const expectedPosition = expected.mapPosition;
  if (
    !position ||
    Math.abs(position.x - expectedPosition.x) > 40 ||
    Math.abs(position.y - expectedPosition.y) > 40
  ) {
    failures.push(`${label}.mapPosition exceeds the allowed 40 px deviation`);
  }
  if (!pointInsideRegion(position, manifest.region.bounds)) {
    failures.push(`${label}.mapPosition is outside the authored region`);
  }

  if (asset.kind === "ambientActor") {
    validateActor(asset, expected, label);
  } else {
    validateSinglePng(asset, expected, label);
  }
  if (asset.kind === "foregroundOccluder") {
    validateOccluder(asset, expected, label);
  }
}

function validateSinglePng(asset, expected, label) {
  expectEqual(`${label}.sourceFile`, asset.sourceFile, expected.sourceFile);
  expectEqual(`${label}.runtimePath`, asset.runtimePath, expected.runtimePath);
  const sourcePath = path.join(intakeRoot, asset.sourceFile ?? "");
  validatePng(sourcePath, asset.canvasSize, label);
  if (fs.existsSync(sourcePath) && sha256(sourcePath) !== asset.sha256) {
    failures.push(`${label} hash does not match manifest`);
  }
}

function validateActor(asset, expected, label) {
  expectEqual(
    `${label}.sourceDirectory`,
    asset.sourceDirectory,
    expected.sourceDirectory,
  );
  expectEqual(
    `${label}.runtimeDirectory`,
    asset.runtimeDirectory,
    expected.runtimeDirectory,
  );
  expectJson(`${label}.frameFiles`, asset.frameFiles, expected.frameFiles);
  expectJson(`${label}.motion`, asset.motion, expected.motion);
  const analyses = new Map();
  for (const frameFile of asset.frameFiles ?? []) {
    const framePath = path.join(intakeRoot, asset.sourceDirectory, frameFile);
    const analysis = validatePng(framePath, asset.canvasSize, `${label}/${frameFile}`);
    if (analysis) {
      analyses.set(frameFile, analysis);
    }
    if (
      fs.existsSync(framePath) &&
      sha256(framePath) !== asset.sha256ByFrame?.[frameFile]
    ) {
      failures.push(`${label}/${frameFile} hash does not match manifest`);
    }
  }
  const referencePixels = analyses.get("frame_00.png")?.visiblePixelCount;
  const referenceBaseline = analyses.get("frame_00.png")?.alphaBounds?.bottom;
  if (
    referenceBaseline !== undefined &&
    Math.abs(referenceBaseline - asset.motion.stableBaselineY) > 8
  ) {
    failures.push(`${label} declared baseline differs from frame 00 by over 8 px`);
  }
  for (const [frameFile, analysis] of analyses) {
    if (referencePixels && analysis.visiblePixelCount / referencePixels < 0.75) {
      failures.push(`${label}/${frameFile} contains less than 75% of frame 00`);
    }
    if (
      referenceBaseline !== undefined &&
      Math.abs((analysis.alphaBounds?.bottom ?? -1) - referenceBaseline) >
      2
    ) {
      failures.push(`${label}/${frameFile} exceeds the 2 px baseline tolerance`);
    }
  }
}

function validateOccluder(asset, expected, label) {
  expectJson(
    `${label}.occludesEntityIds`,
    asset.occludesEntityIds,
    expected.occludesEntityIds,
  );
  const knownEntityIds = new Set(
    (gameplayConfig.sceneEntitySets ?? []).flatMap((set) =>
      (set.entities ?? []).map((entity) => entity.entityId),
    ),
  );
  for (const entityId of asset.occludesEntityIds ?? []) {
    if (!knownEntityIds.has(entityId)) {
      failures.push(`${label} references unknown occluded entity: ${entityId}`);
    }
  }
  const concealment = asset.concealment;
  const expectedConcealment = expected.concealment;
  for (const field of [
    "intendedVisibleRatio",
    "edgePlacement",
  ]) {
    expectEqual(
      `${label}.concealment.${field}`,
      concealment?.[field],
      expectedConcealment?.[field],
    );
  }
  expectJson(
    `${label}.concealment.visualSimilarityTags`,
    concealment?.visualSimilarityTags,
    expectedConcealment?.visualSimilarityTags,
  );
  if (
    asset.occludesEntityIds?.length > 0 &&
    Math.abs(
      concealment.measuredVisibleRatio - concealment.intendedVisibleRatio,
    ) > 0.02
  ) {
    failures.push(`${label} measured concealment differs from intent by over 2%`);
  }
}

function validateReviewImage(fileName, minWidth, minHeight, allowTransparency) {
  const filePath = path.join(intakeRoot, fileName);
  if (!fs.existsSync(filePath)) {
    return;
  }
  try {
    const analysis = analyzeRgbaPng(filePath);
    if (analysis.width < minWidth || analysis.height < minHeight) {
      failures.push(`${fileName} is smaller than ${minWidth}x${minHeight}`);
    }
    if (!allowTransparency && analysis.hasTransparentPixel) {
      failures.push(`${fileName} must be fully opaque`);
    }
  } catch (error) {
    failures.push(`${fileName}: ${error.message}`);
  }
}

function validatePng(filePath, canvasSize, label) {
  if (!fs.existsSync(filePath)) {
    failures.push(`${label} source PNG is missing`);
    return undefined;
  }
  try {
    const analysis = analyzeRgbaPng(filePath);
    if (
      analysis.width !== canvasSize.width ||
      analysis.height !== canvasSize.height
    ) {
      failures.push(
        `${label} must be ${canvasSize.width}x${canvasSize.height}`,
      );
    }
    if (!analysis.hasTransparentPixel || !analysis.hasVisiblePixel) {
      failures.push(`${label} must contain visible pixels and transparency`);
    }
    return analysis;
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
    return undefined;
  }
}

function pointInsideRegion(point, bounds) {
  return (
    point &&
    point.x >= bounds.x &&
    point.y >= bounds.y &&
    point.x <= bounds.x + bounds.width &&
    point.y <= bounds.y + bounds.height
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, received ${actual}`);
  }
}

function expectJson(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
