import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRgbaPng } from "./png-analysis.mjs";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const config = readJson(
  path.join(repoRoot, "cocos/assets/resources/config/demo-gameplay.json"),
);
const budget = readJson(path.join(toolDir, "scene-runtime-budget.json"));
const artRoot = path.join(repoRoot, "cocos/assets/resources/art");
const entities = config.sceneEntitySets?.flatMap((set) => set.entities) ?? [];
const pngFiles = listFiles(artRoot).filter((file) => file.endsWith(".png"));

let rgbaTextureBytes = 0;
for (const file of pngFiles) {
  const analysis = analyzeRgbaPng(file);
  rgbaTextureBytes += analysis.width * analysis.height * 4;
}

const metrics = {
  sceneEntityCount: entities.length,
  configuredMotionEntityCount: entities.filter((entity) => entity.motionProfileId)
    .length,
  regionCount:
    config.sceneEntitySets?.reduce(
      (count, set) => count + (set.regions?.length ?? 0),
      0,
    ) ?? 0,
  maxSelectedTargets: Math.max(
    0,
    ...config.gameModes.map((mode) => selectedTargetUpperBound(mode, config)),
  ),
  rgbaTextureFileCount: pngFiles.length,
  rgbaTextureBytes,
};

const failures = [];
checkMaximum(
  "scene entities",
  metrics.sceneEntityCount,
  budget.maxInstantiatedSceneEntities,
);
checkMaximum(
  "configured motion entities",
  metrics.configuredMotionEntityCount,
  budget.maxConfiguredMotionEntities,
);
checkMaximum(
  "selected target transient upper bound",
  metrics.maxSelectedTargets,
  budget.maxTransientFeedbackNodes,
);
checkMaximum(
  "RGBA texture upper bound",
  metrics.rgbaTextureBytes,
  budget.maxRgbaTextureBytes,
);

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      budgetStatus: budget.status,
      metrics,
      poolingAssessment: {
        sceneEntities: "notRecommendedNodesArePersistent",
        transientFeedback:
          metrics.maxSelectedTargets <= budget.maxTransientFeedbackNodes
            ? "notRequiredBelowThreshold"
            : "recommendedAboveThreshold",
      },
    },
    null,
    2,
  ),
);

function checkMaximum(label, actual, maximum) {
  if (actual > maximum) {
    failures.push(`${label} ${actual} exceeds budget ${maximum}`);
  }
}

function selectedTargetUpperBound(mode, gameplayConfig) {
  const points = gameplayConfig.targetPointSets.find(
    (set) =>
      set.mapId === mode.mapId &&
      gameplayConfig.maps.find((map) => map.mapId === mode.mapId)
        ?.targetPointSetId === set.targetPointSetId,
  )?.targetPoints ?? [];
  const rule = mode.targetSelectionRule;
  if (rule.type === "byCategoryCounts") {
    return Object.values(rule.countsByType).reduce((sum, count) => sum + count, 0);
  }
  if (rule.type === "byTag") {
    return rule.count;
  }
  return points.filter((point) => point.typeId === rule.typeId).length;
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(filePath) : [filePath];
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
