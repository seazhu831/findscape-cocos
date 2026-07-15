import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const manifestPath = path.join(repoRoot, "design/audio/asset-manifest.json");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const failures = [];

validateManifest();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${manifest.assets.length} runtime audio assets`);

function validateManifest() {
  if (manifest.version !== 1) {
    failures.push("manifest.version must be 1");
  }
  if (!manifest.batchId || !manifest.downloadedAt) {
    failures.push("manifest batchId and downloadedAt are required");
  }
  if (!manifest.source?.provider || !manifest.source?.pageUrl) {
    failures.push("manifest source provider and pageUrl are required");
  }
  if (manifest.source?.license !== "CC0-1.0" || !manifest.source?.licenseUrl) {
    failures.push("manifest source must record the CC0-1.0 license and URL");
  }
  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    failures.push("manifest.assets must be a non-empty array");
    return;
  }

  const ids = new Set();
  const runtimePaths = new Set();
  const presets = new Map(
    config.feedbackPresets.map((preset) => [preset.feedbackPresetId, preset]),
  );

  for (const asset of manifest.assets) {
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(asset.assetId ?? "")) {
      failures.push(`${asset.assetId} assetId must be lowercase snake case`);
    }
    if (ids.has(asset.assetId)) {
      failures.push(`${asset.assetId} assetId is duplicated`);
    }
    ids.add(asset.assetId);

    if (!/^audio\/[a-z0-9_]+$/.test(asset.runtimePath ?? "")) {
      failures.push(`${asset.assetId} runtimePath is invalid: ${asset.runtimePath}`);
    }
    if (runtimePaths.has(asset.runtimePath)) {
      failures.push(`${asset.assetId} runtimePath is duplicated`);
    }
    runtimePaths.add(asset.runtimePath);

    const preset = presets.get(asset.feedbackPresetId);
    if (!preset) {
      failures.push(`${asset.assetId} references a missing feedback preset`);
    } else if (preset.soundAsset !== asset.runtimePath) {
      failures.push(
        `${asset.assetId} runtimePath does not match ${asset.feedbackPresetId}.soundAsset`,
      );
    }

    if (!asset.sourceFile || !asset.intendedUse) {
      failures.push(`${asset.assetId} sourceFile and intendedUse are required`);
    }
    validateRuntimeFile(asset);
  }

  for (const preset of config.feedbackPresets) {
    if (preset.soundAsset && !runtimePaths.has(preset.soundAsset)) {
      failures.push(`manifest is missing sound asset: ${preset.soundAsset}`);
    }
  }
}

function validateRuntimeFile(asset) {
  if (!/^cocos\/assets\/resources\/audio\/[a-z0-9_]+\.ogg$/.test(asset.runtimeFile ?? "")) {
    failures.push(`${asset.assetId} runtimeFile is invalid: ${asset.runtimeFile}`);
    return;
  }

  const runtimeFile = path.join(repoRoot, asset.runtimeFile);
  if (!isFile(runtimeFile)) {
    failures.push(`${asset.assetId} runtime file is missing: ${asset.runtimeFile}`);
    return;
  }
  const header = fs.readFileSync(runtimeFile).subarray(0, 4).toString("ascii");
  if (header !== "OggS") {
    failures.push(`${asset.assetId} runtime file is not an OGG stream`);
  }

  if (!isFile(`${runtimeFile}.meta`)) {
    failures.push(`${asset.assetId} Cocos metadata is missing`);
  }
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
