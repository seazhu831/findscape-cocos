import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SceneEntityRegistry } from "../../cocos/assets/scripts/gameplay/scene-entity-runtime.ts";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const configPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const failures = [];

checkDemoModeProjection();
checkFoundAndReset();
checkSemanticLayerOrder();
checkLegacyFallback();
checkTargetLinkedActivation();
checkRegionProjection();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated 6 scene entity runtime fixture groups");

function checkDemoModeProjection() {
  const registry = createRegistry(config);
  registry.projectMode(selectTargets(config, "hidden_object_demo"));
  expectEqual("hidden object active", activeIds(registry).length, 13);
  expectEqual("hidden object interactive", interactiveIds(registry).length, 4);
  expectDeepEqual(
    "hidden object linked occluders",
    activeIds(registry).filter((entityId) =>
      entityId.startsWith("entity_dense_occluder_"),
    ),
    [
      "entity_dense_occluder_puppy_planter",
      "entity_dense_occluder_gem_basket",
      "entity_dense_occluder_lane_shrub",
    ],
  );

  registry.projectMode(selectTargets(config, "balloon_blast_demo"));
  expectEqual("balloon active", activeIds(registry).length, 9);
  expectDeepEqual("balloon target ids", interactiveTargetIds(registry), [
    "demo_balloon_001",
    "demo_balloon_002",
  ]);

  registry.projectMode(selectTargets(config, "crime_hunt_demo"));
  expectDeepEqual("crime target ids", interactiveTargetIds(registry), [
    "demo_thief_001",
  ]);
}

function checkFoundAndReset() {
  const registry = createRegistry(config);
  registry.projectMode(selectTargets(config, "hidden_object_demo"));
  const first = registry.markTargetFound("demo_pineapple_001");
  expectEqual("found state exists", Boolean(first), true);
  expectEqual("found state marked", first?.found, true);
  expectEqual("found target disabled", first?.interactive, false);
  expectEqual(
    "duplicate found rejected",
    registry.markTargetFound("demo_pineapple_001"),
    undefined,
  );
  registry.resetRound();
  expectEqual(
    "reset restores interaction",
    registry.getByTargetId("demo_pineapple_001")?.interactive,
    true,
  );
}

function checkSemanticLayerOrder() {
  const fixture = structuredClone(config);
  fixture.sceneEntitySets[0].entities.push(
    {
      entityId: "fixture_actor",
      mapId: fixture.maps[0].mapId,
      kind: "actor",
      asset: "art/targets/target_puppy",
      transform: { position: { x: 200, y: 200 } },
      render: {
        layer: "ambientActor",
        order: 20,
        visibleByDefault: true,
      },
      activationPolicy: "always",
      tags: ["fixture"],
    },
    {
      entityId: "fixture_occluder",
      mapId: fixture.maps[0].mapId,
      kind: "occluder",
      asset: "art/targets/target_pineapple",
      transform: { position: { x: 210, y: 210 } },
      render: {
        layer: "foregroundOccluder",
        order: 10,
        visibleByDefault: true,
      },
      activationPolicy: "always",
      tags: ["fixture"],
    },
  );
  const registry = createRegistry(fixture);
  registry.projectMode([]);
  const allIds = registry.getAll().map((state) => state.entity.entityId);
  const firstInteractiveIndex = registry
    .getAll()
    .findIndex((state) => state.entity.render.layer === "interactive");
  const finalInteractiveIndex = registry
    .getAll()
    .findLastIndex((state) => state.entity.render.layer === "interactive");
  expectEqual(
    "ambient actor sorts before interactive layer",
    allIds.indexOf("fixture_actor") < firstInteractiveIndex,
    true,
  );
  expectEqual(
    "occluder sorts after interactive layer",
    allIds.indexOf("fixture_occluder") > finalInteractiveIndex,
    true,
  );
  expectDeepEqual(
    "fixture always entities remain active",
    activeIds(registry).filter((entityId) => entityId.startsWith("fixture_")),
    ["fixture_actor", "fixture_occluder"],
  );
}

function checkLegacyFallback() {
  const fixture = structuredClone(config);
  delete fixture.sceneEntitySets;
  delete fixture.motionProfiles;
  delete fixture.maps[0].sceneEntitySetId;
  for (const target of fixture.targetPointSets[0].targetPoints) {
    delete target.entityId;
    delete target.concealment;
  }
  const registry = createRegistry(fixture);
  registry.projectMode(selectTargets(fixture, "hidden_object_demo"));
  expectEqual("legacy entity count", registry.getAll().length, 7);
  expectEqual(
    "legacy flags",
    registry.getAll().every((state) => state.legacyFallback),
    true,
  );
  expectEqual("legacy selected count", interactiveIds(registry).length, 4);
}

function checkTargetLinkedActivation() {
  const fixture = structuredClone(config);
  fixture.sceneEntitySets[0].entities.push({
    entityId: "fixture_puppy_occluder",
    mapId: fixture.maps[0].mapId,
    kind: "occluder",
    asset: "art/targets/target_puppy",
    transform: { position: { x: 490, y: 1990 } },
    render: {
      layer: "foregroundOccluder",
      order: 2100,
      visibleByDefault: true,
    },
    activationPolicy: "modeSelected",
    activationTargetEntityIds: ["entity_demo_puppy_001"],
    tags: ["fixture", "occluder"],
  });
  const registry = createRegistry(fixture);
  registry.projectMode(selectTargets(fixture, "hidden_object_demo"));
  expectEqual(
    "linked occluder active with selected target",
    registry.get("fixture_puppy_occluder")?.active,
    true,
  );
  expectEqual(
    "linked occluder remains non-interactive",
    registry.get("fixture_puppy_occluder")?.interactive,
    false,
  );
  registry.projectMode(selectTargets(fixture, "balloon_blast_demo"));
  expectEqual(
    "linked occluder inactive outside target mode",
    registry.get("fixture_puppy_occluder")?.active,
    false,
  );
}

function checkRegionProjection() {
  const registry = createRegistry(config);
  registry.projectMode(selectTargets(config, "hidden_object_demo"));
  expectEqual(
    "default projection preserves authored entities",
    activeIds(registry).length,
    13,
  );
  expectEqual("empty region projection changes state", registry.projectRegions(new Set()), true);
  expectEqual("offscreen region removes dense entities", activeIds(registry).length, 4);
  expectEqual(
    "stable empty projection reports no change",
    registry.projectRegions(new Set()),
    false,
  );
  expectEqual(
    "lower garden projection changes state",
    registry.projectRegions(new Set(["region_lower_garden_v1"])),
    true,
  );
  expectEqual("lower garden restores dense entities", activeIds(registry).length, 13);
}

function createRegistry(gameplayConfig) {
  const map = gameplayConfig.maps[0];
  const targetPointSet = gameplayConfig.targetPointSets.find(
    (item) => item.targetPointSetId === map.targetPointSetId,
  );
  const sceneEntitySet = gameplayConfig.sceneEntitySets?.find(
    (item) => item.sceneEntitySetId === map.sceneEntitySetId,
  );
  return new SceneEntityRegistry({
    map,
    targetPointSet,
    targetTypesById: new Map(
      gameplayConfig.targetTypes.map((item) => [item.typeId, item]),
    ),
    sceneEntitySet,
  });
}

function selectTargets(gameplayConfig, modeId) {
  const mode = gameplayConfig.gameModes.find((item) => item.modeId === modeId);
  const points = gameplayConfig.targetPointSets[0].targetPoints;
  const rule = mode.targetSelectionRule;
  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType).flatMap(([typeId, count]) =>
      points.filter((point) => point.typeId === typeId).slice(0, count),
    );
  }
  if (rule.type === "allOfType") {
    return points.filter((point) => point.typeId === rule.typeId);
  }
  return points
    .filter((point) => point.tags.includes(rule.tag))
    .slice(0, rule.count);
}

function activeIds(registry) {
  return registry
    .getAll()
    .filter((state) => state.active)
    .map((state) => state.entity.entityId);
}

function interactiveIds(registry) {
  return registry
    .getAll()
    .filter((state) => state.interactive)
    .map((state) => state.entity.entityId);
}

function interactiveTargetIds(registry) {
  return registry
    .getAll()
    .filter((state) => state.interactive)
    .map((state) => state.targetId);
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, received ${actual}`);
  }
}

function expectDeepEqual(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
