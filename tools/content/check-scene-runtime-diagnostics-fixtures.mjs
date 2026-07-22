import {
  createSceneRuntimeDiagnosticsSnapshot,
} from "../../cocos/assets/scripts/gameplay/scene-runtime-diagnostics.ts";

const states = [
  createState("actor", "ambientActor", true, false, false),
  createState("target", "interactive", true, true, false),
  createState("found", "interactive", true, false, true),
  createState("offscreen", "staticDecoration", false, false, false),
];
const snapshot = createSceneRuntimeDiagnosticsSnapshot({
  states,
  regions: [
    {
      regionId: "lower_garden",
      bounds: { x: 0, y: 0, width: 100, height: 100 },
      activationMargin: 20,
      tags: [],
    },
  ],
  activeRegionIds: new Set(["lower_garden"]),
  visibleEntityIds: new Set(["actor", "target"]),
  motionPlans: [
    {
      entityId: "actor",
      motionProfileId: "idle",
      variant: {
        variantId: "bob",
        driver: "tween",
        durationMs: 1000,
        offset: { x: 0, y: 1 },
        yoyo: true,
        loop: true,
      },
      startDelayMs: 0,
      playbackRate: 1,
      offscreen: false,
    },
  ],
  instantiatedNodeCount: 7.8,
  residentTextureBytesEstimate: 1024.9,
});

const expected = {
  regionCount: 1,
  activeRegionCount: 1,
  activeRegionIds: ["lower_garden"],
  entityCount: 4,
  activeEntityCount: 3,
  visibleEntityCount: 2,
  interactiveEntityCount: 1,
  foundTargetCount: 1,
  scheduledMotionCount: 1,
  offscreenMotionCount: 0,
  instantiatedNodeCount: 7,
  residentTextureBytesEstimate: 1024,
  activeEntityCountByLayer: {
    background: 0,
    staticDecoration: 0,
    ambientActor: 1,
    interactive: 2,
    foregroundOccluder: 0,
  },
};

if (JSON.stringify(snapshot) !== JSON.stringify(expected)) {
  console.error(`- snapshot mismatch: ${JSON.stringify(snapshot)}`);
  process.exit(1);
}

console.log("Validated scene runtime diagnostics snapshot");

function createState(entityId, layer, active, interactive, found) {
  return {
    entity: {
      entityId,
      mapId: "fixture",
      kind: layer === "interactive" ? "interactive" : "decoration",
      asset: "fixture",
      transform: { position: { x: 0, y: 0 } },
      render: { layer, order: 0, visibleByDefault: true },
      tags: [],
    },
    selected: interactive || found,
    active,
    interactive,
    found,
    legacyFallback: false,
  };
}
