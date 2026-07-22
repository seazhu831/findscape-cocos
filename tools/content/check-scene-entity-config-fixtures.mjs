import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(toolDir, "../..");
const validatorPath = path.join(toolDir, "validate-gameplay-config.mjs");
const baseConfigPath = path.join(
  repoRoot,
  "cocos/assets/resources/config/demo-gameplay.json",
);
const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, "utf8"));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "findscape-entity-fixtures-"));

const fixtures = [
  {
    name: "legacy config remains valid",
    config: createLegacyConfig(),
    valid: true,
  },
  {
    name: "layered entity config is valid",
    config: createEntityConfig(),
    valid: true,
  },
  {
    name: "unknown target entity fails",
    config: mutate(createEntityConfig(), (config) => {
      config.targetPointSets[0].targetPoints[0].entityId = "missing_entity";
    }),
    error: "references unknown id: missing_entity",
  },
  {
    name: "duplicate entity id fails",
    config: mutate(createEntityConfig(), (config) => {
      config.sceneEntitySets[0].entities[1].entityId = "entity_fixture_target";
    }),
    error: "Duplicate entityId in sceneEntitySets",
  },
  {
    name: "out of bounds entity fails",
    config: mutate(createEntityConfig(), (config) => {
      config.sceneEntitySets[0].entities[0].transform.position.x = 9999;
    }),
    error: "transform.position must be inside map bounds",
  },
  {
    name: "unknown motion profile fails",
    config: mutate(createEntityConfig(), (config) => {
      config.sceneEntitySets[0].entities[0].motionProfileId = "missing_motion";
    }),
    error: "motionProfileId references unknown id: missing_motion",
  },
  {
    name: "invalid tween motion fails",
    config: mutate(createEntityConfig(), (config) => {
      config.motionProfiles[0].idleVariants[0].durationMs = 0;
    }),
    error: "durationMs must be a positive number",
  },
  {
    name: "animation clip source is required",
    config: mutate(createEntityConfig(), (config) => {
      config.motionProfiles[0].idleVariants.push({
        variantId: "invalid_clip",
        driver: "animationClip",
        speed: 1,
        loop: true,
      });
    }),
    error: "must define exactly one of clipAsset or frameAssets",
  },
  {
    name: "non occluder concealment reference fails",
    config: mutate(createEntityConfig(), (config) => {
      config.targetPointSets[0].targetPoints[0].concealment.occluderEntityIds = [
        "entity_fixture_target",
      ];
    }),
    error: "must reference entities with kind occluder",
  },
  {
    name: "target and entity position mismatch fails",
    config: mutate(createEntityConfig(), (config) => {
      config.targetPointSets[0].targetPoints[0].position.x += 1;
    }),
    error: "position must match the linked entity position",
  },
  {
    name: "linked mode activation is valid",
    config: mutate(createEntityConfig(), (config) => {
      const occluder = config.sceneEntitySets[0].entities[1];
      occluder.activationPolicy = "modeSelected";
      occluder.activationTargetEntityIds = ["entity_fixture_target"];
    }),
    valid: true,
  },
  {
    name: "unknown linked activation target fails",
    config: mutate(createEntityConfig(), (config) => {
      const occluder = config.sceneEntitySets[0].entities[1];
      occluder.activationPolicy = "modeSelected";
      occluder.activationTargetEntityIds = ["missing_entity"];
    }),
    error: "activationTargetEntityIds references unknown id: missing_entity",
  },
  {
    name: "linked activation requires mode selected policy",
    config: mutate(createEntityConfig(), (config) => {
      config.sceneEntitySets[0].entities[1].activationTargetEntityIds = [
        "entity_fixture_target",
      ];
    }),
    error: "activationTargetEntityIds requires activationPolicy modeSelected",
  },
];

try {
  for (const [index, fixture] of fixtures.entries()) {
    const fixturePath = path.join(tempDir, `${index + 1}.json`);
    fs.writeFileSync(fixturePath, JSON.stringify(fixture.config));
    const result = spawnSync(process.execPath, [validatorPath, fixturePath], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    const output = `${result.stdout}\n${result.stderr}`;
    if (fixture.valid && result.status !== 0) {
      throw new Error(`${fixture.name} should pass:\n${output}`);
    }
    if (!fixture.valid && result.status === 0) {
      throw new Error(`${fixture.name} should fail`);
    }
    if (fixture.error && !output.includes(fixture.error)) {
      throw new Error(
        `${fixture.name} should include error ${JSON.stringify(fixture.error)}:\n${output}`,
      );
    }
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

console.log(`Validated ${fixtures.length} scene entity config fixture groups`);

function createEntityConfig() {
  const config = createLegacyConfig();
  const target = config.targetPointSets[0].targetPoints[0];
  config.maps[0].sceneEntitySetId = "fixture_entities";
  config.motionProfiles = [
    {
      motionProfileId: "fixture_idle",
      idleVariants: [
        {
          variantId: "subtle_bob",
          driver: "tween",
          durationMs: 1600,
          offset: { x: 0, y: -6 },
          easing: "sineInOut",
          yoyo: true,
          loop: true,
        },
      ],
      startDelayMinMs: 0,
      startDelayMaxMs: 400,
      offscreenPolicy: "pause",
    },
  ];
  config.sceneEntitySets = [
    {
      sceneEntitySetId: "fixture_entities",
      mapId: config.maps[0].mapId,
      entities: [
        {
          entityId: "entity_fixture_target",
          mapId: target.mapId,
          kind: "interactive",
          asset: "art/targets/target_pineapple",
          transform: {
            position: structuredClone(target.position),
            scale: { x: 1, y: 1 },
            anchor: { x: 0.5, y: 0.5 },
          },
          render: {
            layer: "interactive",
            order: 100,
            visibleByDefault: true,
          },
          motionProfileId: "fixture_idle",
          activationPolicy: "modeSelected",
          tags: ["fixture", "target"],
        },
        {
          entityId: "entity_fixture_occluder",
          mapId: target.mapId,
          kind: "occluder",
          asset: "art/targets/target_pineapple",
          transform: {
            position: {
              x: target.position.x + 10,
              y: target.position.y + 10,
            },
          },
          render: {
            layer: "foregroundOccluder",
            order: 200,
            visibleByDefault: true,
          },
          activationPolicy: "nearViewport",
          tags: ["fixture", "occluder"],
        },
      ],
    },
  ];
  target.entityId = "entity_fixture_target";
  target.concealment = {
    occluderEntityIds: ["entity_fixture_occluder"],
    intendedVisibleRatio: 0.65,
    visualSimilarityTags: ["green"],
    edgePlacement: "soft",
    scaleClass: "medium",
  };
  return config;
}

function createLegacyConfig() {
  const config = structuredClone(baseConfig);
  delete config.motionProfiles;
  delete config.sceneEntitySets;
  for (const map of config.maps) {
    delete map.sceneEntitySetId;
  }
  for (const pointSet of config.targetPointSets) {
    for (const target of pointSet.targetPoints) {
      delete target.entityId;
      delete target.concealment;
    }
  }
  return config;
}

function mutate(config, mutation) {
  mutation(config);
  return config;
}
