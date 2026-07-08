import fs from "node:fs";
import path from "node:path";

const [, , configPathArg] = process.argv;

if (!configPathArg) {
  fail("Usage: node tools/content/preview-gameplay-modes.mjs <config-file>");
}

const configPath = path.resolve(process.cwd(), configPathArg);
const config = readJson(configPath);

for (const mode of config.gameModes ?? []) {
  const mapConfig = findById(config.maps, "mapId", mode.mapId);
  const targetPointSet = findById(
    config.targetPointSets,
    "targetPointSetId",
    mapConfig?.targetPointSetId,
  );
  const selectedTargets = selectTargetsForMode(
    mode,
    targetPointSet?.targetPoints ?? [],
  );
  const countsByType = countBy(selectedTargets, "typeId");

  if (selectedTargets.length === 0) {
    fail(`Mode ${mode.modeId} selected no targets`);
  }

  console.log(
    `${mode.modeId}: ${selectedTargets.length} targets (${formatCounts(countsByType)})`,
  );
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Failed to read JSON from ${filePath}: ${error.message}`);
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function findById(items, field, id) {
  return (items ?? []).find((item) => item?.[field] === id);
}

function selectTargetsForMode(mode, targetPoints) {
  const rule = mode.targetSelectionRule;

  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType ?? {}).flatMap(([typeId, count]) =>
      targetPoints
        .filter((targetPoint) => targetPoint.typeId === typeId)
        .slice(0, count),
    );
  }

  if (rule.type === "byTag") {
    return targetPoints
      .filter((targetPoint) => targetPoint.tags?.includes(rule.tag))
      .slice(0, rule.count);
  }

  if (rule.type === "allOfType") {
    return targetPoints.filter(
      (targetPoint) => targetPoint.typeId === rule.typeId,
    );
  }

  fail(`Unsupported target selection rule: ${rule.type}`);
}

function countBy(items, field) {
  const counts = new Map();
  for (const item of items) {
    const key = item[field];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function formatCounts(counts) {
  return [...counts.entries()]
    .map(([typeId, count]) => `${typeId}=${count}`)
    .join(", ");
}
