import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const manifestPath = path.join(
  repoRoot,
  "design/claude-design/asset-manifest.json",
);
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const failures = [];

validateManifestShape(manifest);
validateAssets(manifest.assets ?? []);
validateConfigAssetCoverage(manifest.assets ?? [], config);
validateAudioHooks(manifest.audioHooks ?? [], config);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${manifest.assets.length} design asset manifest entries`);

function validateManifestShape(value) {
  if (value.version !== 1) {
    failures.push("manifest.version must be 1");
  }
  if (value.designTool !== "Claude Design") {
    failures.push("manifest.designTool must be Claude Design");
  }
  if (!Array.isArray(value.assets) || value.assets.length === 0) {
    failures.push("manifest.assets must be a non-empty array");
  }
}

function validateAssets(assets) {
  const assetIds = new Set();
  const runtimePaths = new Set();
  const validStates = new Set(["brief", "sourceExport", "runtimeAsset"]);

  for (const asset of assets) {
    if (!isSnakeCase(asset.assetId)) {
      failures.push(`${asset.assetId} assetId must be lowercase snake case`);
    }
    if (assetIds.has(asset.assetId)) {
      failures.push(`${asset.assetId} assetId is duplicated`);
    }
    assetIds.add(asset.assetId);

    if (!validStates.has(asset.state)) {
      failures.push(`${asset.assetId} has invalid state: ${asset.state}`);
    }
    if (!asset.sourceBrief || !fileExists(path.join(repoRoot, "design/claude-design", asset.sourceBrief))) {
      failures.push(`${asset.assetId} sourceBrief is missing: ${asset.sourceBrief}`);
    }
    if (!isRuntimePath(asset.runtimePath)) {
      failures.push(`${asset.assetId} runtimePath is invalid: ${asset.runtimePath}`);
    }
    if (runtimePaths.has(asset.runtimePath)) {
      failures.push(`${asset.assetId} runtimePath is duplicated: ${asset.runtimePath}`);
    }
    runtimePaths.add(asset.runtimePath);

    if (!asset.dimensions || asset.dimensions.width <= 0 || asset.dimensions.height <= 0) {
      failures.push(`${asset.assetId} dimensions must be positive`);
    }
    if (typeof asset.transparentBackground !== "boolean") {
      failures.push(`${asset.assetId} transparentBackground must be boolean`);
    }
    if (!asset.intendedUse) {
      failures.push(`${asset.assetId} intendedUse is required`);
    }
    if (!Array.isArray(asset.configReferences) || asset.configReferences.length === 0) {
      failures.push(`${asset.assetId} configReferences must be non-empty`);
    }
  }
}

function validateConfigAssetCoverage(assets, gameplayConfig) {
  const manifestPaths = new Set(assets.map((asset) => asset.runtimePath));
  const requiredPaths = [
    ...gameplayConfig.maps.map((mapConfig) => mapConfig.backgroundAsset),
    ...gameplayConfig.targetTypes.flatMap((targetType) => [
      targetType.iconAsset,
      targetType.targetAsset,
    ]),
    ...gameplayConfig.tools.map((tool) => tool.iconAsset),
  ];

  for (const requiredPath of requiredPaths) {
    if (!manifestPaths.has(requiredPath)) {
      failures.push(`manifest is missing config asset path: ${requiredPath}`);
    }
  }

  for (const asset of assets) {
    for (const reference of asset.configReferences) {
      validateConfigReference(asset.assetId, reference, gameplayConfig);
    }
  }
}

function validateConfigReference(assetId, reference, gameplayConfig) {
  const parts = reference.split(".");
  const [collection, id, field] = parts;

  if (collection === "maps") {
    const mapConfig = gameplayConfig.maps.find((item) => item.mapId === id);
    validateExistingReference(assetId, reference, mapConfig, field);
    return;
  }

  if (collection === "targetTypes") {
    const targetType = gameplayConfig.targetTypes.find((item) => item.typeId === id);
    validateExistingReference(assetId, reference, targetType, field);
    return;
  }

  if (collection === "tools") {
    const tool = gameplayConfig.tools.find((item) => item.toolId === id);
    validateExistingReference(assetId, reference, tool, field);
    return;
  }

  if (collection === "feedbackPresets") {
    const preset = gameplayConfig.feedbackPresets.find(
      (item) => item.feedbackPresetId === id,
    );
    validateExistingReference(assetId, reference, preset);
    return;
  }

  if (collection === "gameModes") {
    const mode = gameplayConfig.gameModes.find((item) => item.modeId === id);
    validateExistingReference(assetId, reference, mode);
    return;
  }

  failures.push(`${assetId} has unknown config reference: ${reference}`);
}

function validateExistingReference(assetId, reference, item, field) {
  if (!item) {
    failures.push(`${assetId} references missing config item: ${reference}`);
    return;
  }
  if (field && !(field in item)) {
    failures.push(`${assetId} references missing config field: ${reference}`);
  }
}

function validateAudioHooks(audioHooks, gameplayConfig) {
  const requiredAudioHooks = gameplayConfig.feedbackPresets
    .map((preset) => preset.soundAsset)
    .filter(Boolean);
  const audioHookSet = new Set(audioHooks);

  for (const soundAsset of requiredAudioHooks) {
    if (!audioHookSet.has(soundAsset)) {
      failures.push(`manifest audioHooks is missing sound asset: ${soundAsset}`);
    }
  }
}

function isSnakeCase(value) {
  return typeof value === "string" && /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(value);
}

function isRuntimePath(value) {
  return (
    typeof value === "string" &&
    !path.extname(value) &&
    /^(art\/maps|art\/icons|art\/targets|art\/ui|art\/feedback)\/[a-z0-9_]+$/.test(value)
  );
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
