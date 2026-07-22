import {
  resolveActiveSceneRegionIds,
  resolveVisibleSceneEntityIds,
  viewportToMapRectangle,
} from "../../cocos/assets/scripts/gameplay/scene-region-runtime.ts";

const failures = [];
const region = {
  regionId: "lower_garden",
  bounds: { x: 320, y: 1500, width: 1000, height: 760 },
  activationMargin: 180,
  tags: ["fixture"],
};

checkViewportConversion();
checkRegionIntersection();
checkActivationMargin();
checkDistantRegion();
checkVisibleEntities();

if (failures.length > 0) {
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Validated 5 scene region runtime fixture groups");

function checkViewportConversion() {
  expectDeepEqual(
    "viewport rectangle",
    viewportToMapRectangle({
      center: { x: 800, y: 1200 },
      viewSize: { width: 400, height: 800 },
      zoom: 2,
    }),
    { x: 700, y: 1000, width: 200, height: 400 },
  );
}

function checkRegionIntersection() {
  expectDeepEqual(
    "intersecting region",
    [...resolveActiveSceneRegionIds([region], { x: 500, y: 1600, width: 300, height: 500 })],
    ["lower_garden"],
  );
}

function checkActivationMargin() {
  expectDeepEqual(
    "activation margin preload",
    [...resolveActiveSceneRegionIds([region], { x: 600, y: 1320, width: 200, height: 1 })],
    ["lower_garden"],
  );
}

function checkDistantRegion() {
  expectDeepEqual(
    "distant region inactive",
    [...resolveActiveSceneRegionIds([region], { x: 0, y: 0, width: 200, height: 200 })],
    [],
  );
}

function checkVisibleEntities() {
  const entities = [
    createEntity("inside", 100, 100),
    createEntity("margin", 225, 100),
    createEntity("outside", 260, 100),
  ];
  expectDeepEqual(
    "visible entity margin",
    [...resolveVisibleSceneEntityIds(entities, { x: 0, y: 0, width: 200, height: 200 }, 25)],
    ["inside", "margin"],
  );
}

function createEntity(entityId, x, y) {
  return {
    entityId,
    mapId: "fixture",
    kind: "decoration",
    asset: "fixture",
    transform: { position: { x, y } },
    render: { layer: "staticDecoration", order: 0, visibleByDefault: true },
    tags: [],
  };
}

function expectDeepEqual(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
