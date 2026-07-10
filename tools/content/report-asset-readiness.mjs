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
const runtimeRoot = path.join(repoRoot, "cocos/assets/resources");
const runtimeExtensions = [".png", ".webp", ".jpg", ".jpeg"];

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const manifestAssetsByPath = new Map(
  (manifest.assets ?? []).map((asset) => [asset.runtimePath, asset]),
);
const requiredAssets = collectRequiredAssets(config);

const rows = requiredAssets.map((requiredAsset) => {
  const manifestAsset = manifestAssetsByPath.get(requiredAsset.runtimePath);
  const runtimeFile = findRuntimeFile(requiredAsset.runtimePath);

  return {
    owner: requiredAsset.owner,
    field: requiredAsset.field,
    runtimePath: requiredAsset.runtimePath,
    manifestState: manifestAsset?.state ?? "missing_manifest",
    assetId: manifestAsset?.assetId ?? "",
    runtimeFile: runtimeFile ? path.relative(runtimeRoot, runtimeFile) : "",
  };
});

const counts = rows.reduce(
  (result, row) => {
    result.total += 1;
    if (row.manifestState === "missing_manifest") {
      result.missingManifest += 1;
    }
    if (row.runtimeFile) {
      result.runtimeFiles += 1;
    }
    if (row.manifestState === "brief") {
      result.briefOnly += 1;
    }
    if (row.manifestState === "sourceExport") {
      result.sourceExports += 1;
    }
    if (row.manifestState === "runtimeAsset") {
      result.runtimeAssets += 1;
    }
    return result;
  },
  {
    total: 0,
    missingManifest: 0,
    briefOnly: 0,
    sourceExports: 0,
    runtimeAssets: 0,
    runtimeFiles: 0,
  },
);

printSummary(counts);
printRows(rows);

function collectRequiredAssets(gameplayConfig) {
  return [
    ...gameplayConfig.maps.map((mapConfig) => ({
      owner: `map:${mapConfig.mapId}`,
      field: "backgroundAsset",
      runtimePath: mapConfig.backgroundAsset,
    })),
    ...gameplayConfig.targetTypes.flatMap((targetType) => [
      {
        owner: `targetType:${targetType.typeId}`,
        field: "iconAsset",
        runtimePath: targetType.iconAsset,
      },
      {
        owner: `targetType:${targetType.typeId}`,
        field: "targetAsset",
        runtimePath: targetType.targetAsset,
      },
    ]),
    ...gameplayConfig.tools.map((tool) => ({
      owner: `tool:${tool.toolId}`,
      field: "iconAsset",
      runtimePath: tool.iconAsset,
    })),
  ];
}

function findRuntimeFile(runtimePath) {
  for (const extension of runtimeExtensions) {
    const filePath = path.join(runtimeRoot, `${runtimePath}${extension}`);
    if (fileExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

function printSummary(summary) {
  console.log("Asset readiness");
  console.log(`- Required config assets: ${summary.total}`);
  console.log(`- Manifest entries still brief-only: ${summary.briefOnly}`);
  console.log(`- Manifest entries with source exports: ${summary.sourceExports}`);
  console.log(`- Manifest entries marked runtimeAsset: ${summary.runtimeAssets}`);
  console.log(`- Runtime files present: ${summary.runtimeFiles}`);
  console.log(`- Missing manifest entries: ${summary.missingManifest}`);
}

function printRows(reportRows) {
  console.log("");
  console.log(
    [
      "owner",
      "field",
      "runtimePath",
      "manifestState",
      "assetId",
      "runtimeFile",
    ].join("\t"),
  );

  for (const row of reportRows) {
    console.log(
      [
        row.owner,
        row.field,
        row.runtimePath,
        row.manifestState,
        row.assetId,
        row.runtimeFile || "-",
      ].join("\t"),
    );
  }
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
