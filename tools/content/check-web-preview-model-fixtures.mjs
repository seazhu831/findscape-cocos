import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const manifestPath = path.join(
  repoRoot,
  "design/claude-design/asset-manifest.json",
);
const fixturePath = path.join(scriptDir, "fixtures/web-preview-model-cases.json");
const modelModulePath = path.join(
  repoRoot,
  "cocos/web-preview/preview-model.mjs",
);
const {
  applyPreviewTap,
  createAssetStateCounts,
  createPreviewModel,
  createTargetCounts,
  getActiveModeAssets,
  isPreviewComplete,
  panPreviewViewport,
  resetPreviewViewport,
  setPreviewViewSize,
  zoomPreviewViewport,
} = await import(pathToFileURL(modelModulePath));
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const fixtures = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const failures = [];

for (const fixture of fixtures) {
  let model = createPreviewModel(config, manifest, fixture.modeId);

  if (fixture.expectedInitial) {
    assertPreviewState(fixture.name, "initial", model, fixture.expectedInitial);
  }

  for (const step of fixture.steps ?? []) {
    if (step.type === "tap") {
      model = applyPreviewTap(model, step.point);
    } else if (step.type === "setViewSize") {
      model = setPreviewViewSize(model, step.viewSize);
    } else if (step.type === "pan") {
      model = panPreviewViewport(model, step.screenDelta);
    } else if (step.type === "resetViewport") {
      model = resetPreviewViewport(model, step.viewSize);
    } else if (step.type === "zoom") {
      model = zoomPreviewViewport(
        model,
        step.nextZoom,
        step.anchorScreenPoint,
      );
    } else {
      failures.push(`${fixture.name} has unsupported step type: ${step.type}`);
      continue;
    }
    assertPreviewState(fixture.name, step.type, model, step.expected);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated ${fixtures.length} web preview model fixture groups`);

function assertPreviewState(name, label, model, expected) {
  const actual = {
    selectedTargetCount: model.selectedTargets.length,
    foundCount: model.foundTargetIds.size,
    score: model.score,
    isComplete: isPreviewComplete(model),
    targetCounts: Object.fromEntries(createTargetCounts(model)),
    assetStateCounts: createAssetStateCounts(manifest),
    activeAssetPaths: getActiveModeAssets(model).map((asset) => asset.runtimePath),
    viewport: {
      center: model.viewport.center,
      zoom: model.viewport.zoom,
    },
  };
  assertPartialObject(name, label, actual, expected);
}

function assertPartialObject(name, label, actual, expected) {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = actual[key];
    if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
      failures.push(
        `${name} ${label}.${key}: expected ${JSON.stringify(
          expectedValue,
        )}, got ${JSON.stringify(actualValue)}`,
      );
    }
  }
}
