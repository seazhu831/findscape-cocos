import {
  REDUCED_RATE_PLAYBACK,
  createEntityMotionSchedule,
} from "../../cocos/assets/scripts/gameplay/entity-motion-scheduler.ts";

const failures = [];
const profiles = [
  {
    motionProfileId: "bob",
    idleVariants: [
      {
        variantId: "bob_a",
        driver: "tween",
        durationMs: 1000,
        offset: { x: 0, y: 4 },
        yoyo: true,
        loop: true,
      },
      {
        variantId: "bob_b",
        driver: "tween",
        durationMs: 1200,
        offset: { x: 0, y: 7 },
        yoyo: true,
        loop: true,
      },
    ],
    startDelayMinMs: 100,
    startDelayMaxMs: 500,
    offscreenPolicy: "pause",
  },
  {
    motionProfileId: "sway_reduced",
    idleVariants: [
      {
        variantId: "sway",
        driver: "tween",
        durationMs: 1600,
        rotationDegrees: 2,
        yoyo: true,
        loop: true,
      },
    ],
    offscreenPolicy: "reducedRate",
  },
  {
    motionProfileId: "continue",
    idleVariants: [
      {
        variantId: "frames",
        driver: "spriteFrames",
        frameAssets: ["frame_a", "frame_b"],
        framesPerSecond: 8,
        loop: true,
      },
    ],
    offscreenPolicy: "continue",
  },
];

checkStablePlanning();
checkVisibilityPolicies();
checkBudgetAndPriority();
checkInactiveAndMissingProfiles();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated 4 entity motion scheduler fixture groups");

function checkStablePlanning() {
  const states = [createState("entity_a", "bob"), createState("entity_b", "bob")];
  const first = createEntityMotionSchedule(states, profiles);
  const second = createEntityMotionSchedule(states, profiles);
  expectDeepEqual("stable schedule", first, second);
  expectEqual("stable plan count", first.length, 2);
  expectEqual(
    "delays stay in range",
    first.every((plan) => plan.startDelayMs >= 100 && plan.startDelayMs <= 500),
    true,
  );
  expectEqual(
    "entities do not synchronize",
    first[0].startDelayMs !== first[1].startDelayMs ||
      first[0].variant.variantId !== first[1].variant.variantId,
    true,
  );
}

function checkVisibilityPolicies() {
  const states = [
    createState("paused_offscreen", "bob"),
    createState("reduced_offscreen", "sway_reduced"),
    createState("continued_offscreen", "continue"),
    createState("visible_bob", "bob"),
  ];
  const visible = new Set(["visible_bob"]);
  const result = createEntityMotionSchedule(states, profiles, {
    visibleEntityIds: visible,
  });
  expectDeepEqual(
    "pause policy omitted",
    result.map((plan) => plan.entityId),
    ["visible_bob", "continued_offscreen", "reduced_offscreen"],
  );
  expectEqual(
    "reduced playback",
    result.find((plan) => plan.entityId === "reduced_offscreen")?.playbackRate,
    REDUCED_RATE_PLAYBACK,
  );
  expectEqual(
    "continue playback",
    result.find((plan) => plan.entityId === "continued_offscreen")?.playbackRate,
    1,
  );
}

function checkBudgetAndPriority() {
  const states = [
    createState("visible_z", "bob"),
    createState("visible_a", "bob"),
    createState("offscreen_a", "continue"),
  ];
  const result = createEntityMotionSchedule(states, profiles, {
    visibleEntityIds: new Set(["visible_z", "visible_a"]),
    maxActiveMotions: 2,
  });
  expectDeepEqual(
    "visible entities win budget in stable order",
    result.map((plan) => plan.entityId),
    ["visible_a", "visible_z"],
  );
  expectEqual(
    "zero budget",
    createEntityMotionSchedule(states, profiles, { maxActiveMotions: 0 }).length,
    0,
  );
}

function checkInactiveAndMissingProfiles() {
  const inactive = createState("inactive", "bob");
  inactive.active = false;
  const result = createEntityMotionSchedule(
    [inactive, createState("static", undefined), createState("missing", "missing")],
    profiles,
  );
  expectEqual("invalid candidates omitted", result.length, 0);
}

function createState(entityId, motionProfileId) {
  return {
    entity: {
      entityId,
      mapId: "fixture_map",
      kind: "actor",
      asset: "fixture_asset",
      transform: { position: { x: 0, y: 0 } },
      render: {
        layer: "ambientActor",
        order: 0,
        visibleByDefault: true,
      },
      motionProfileId,
      activationPolicy: "always",
      tags: [],
    },
    selected: false,
    active: true,
    interactive: false,
    found: false,
    legacyFallback: false,
  };
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
