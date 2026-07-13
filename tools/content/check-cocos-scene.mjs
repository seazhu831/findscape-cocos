import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const cocosRoot = path.join(repoRoot, "cocos");
const scenePath = path.join(cocosRoot, "assets/scenes/portrait-demo.scene");
const projectSettingsPath = path.join(
  cocosRoot,
  "settings/v2/packages/project.json",
);
const hudSourcePath = path.join(
  cocosRoot,
  "assets/scripts/ui/portrait-hud.ts",
);
const failures = [];

const scene = JSON.parse(fs.readFileSync(scenePath, "utf8"));
const projectSettings = JSON.parse(
  fs.readFileSync(projectSettingsPath, "utf8"),
);
const hudSource = fs.readFileSync(hudSourcePath, "utf8");
const nodes = scene.filter((entry) => entry?.__type__ === "cc.Node");
const nodesByName = new Map(nodes.map((node) => [node._name, node]));

expectEqual(projectSettings.general?.designResolution?.width, 1080, "design width");
expectEqual(projectSettings.general?.designResolution?.height, 1920, "design height");

const canvas = requireNode("Canvas");
const camera = requireNode("Camera");
const mapWorld = requireNode("MapWorld");
const map = requireNode("Map");
const hudRoot = requireNode("HUDRoot");
expectChild(canvas, camera);
expectChild(canvas, mapWorld);
expectChild(canvas, hudRoot);
expectChild(mapWorld, map);
expectVector(mapWorld?._lscale, 1, 1, "MapWorld scale");
expectContentSize(map, 1600, 2400);
expectSpriteFrame(map, "adf71751-5e84-4cd7-9d68-3165f4a4c543@f9941");
expectContentSize(hudRoot, 1080, 1920);
expectCustomComponent(hudRoot, "9d6986zY6tFNYfqeaJhWbx/");
for (const requiredHudContract of [
  '"TopBar"',
  '"TargetPanel"',
  '"HintButton"',
  '"MagnifierButton"',
  "new Vec3(0, 800, 0)",
  "new Vec3(0, -766, 0)",
  "new Vec3(-400, -540, 0)",
  "new Vec3(400, -540, 0)",
  "const slotXs = [-380, -190, 0, 190, 380]",
]) {
  if (!hudSource.includes(requiredHudContract)) {
    failures.push(`PortraitHud is missing contract: ${requiredHudContract}`);
  }
}

const targets = [
  ["demo_pineapple_001", -470, 340, "3f49362c-1baf-4c1a-9811-d452db44fdd8@f9941"],
  ["demo_puppy", -320, -780, "9361326b-50ac-477e-b7e2-e631b04b44a2@f9941"],
  ["demo_balloon_001", 130, 840, "2c49839c-1bd2-4074-bbad-09a12ad19c04@f9941"],
  ["demo_thief", 260, -110, "60c6743f-c87f-4184-8bf5-788e7f381ea9@f9941"],
  ["demo_pineapple_002", 530, 160, "3f49362c-1baf-4c1a-9811-d452db44fdd8@f9941"],
  ["demo_gem", 400, -890, "ada04348-94d2-4f71-a139-e189ee53b468@f9941"],
  ["demo_balloon_002", 370, -420, "2c49839c-1bd2-4074-bbad-09a12ad19c04@f9941"],
];

for (const [name, x, y, spriteFrameUuid] of targets) {
  const node = requireNode(name);
  expectChild(mapWorld, node);
  expectVector(node?._lpos, x, y, `${name} position`);
  expectSpriteFrame(node, spriteFrameUuid);
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated portrait Cocos scene with 7 independent targets");

function requireNode(name) {
  const node = nodesByName.get(name);
  if (!node) {
    failures.push(`scene is missing node: ${name}`);
  }
  return node;
}

function expectChild(parent, child) {
  if (!parent || !child) {
    return;
  }
  const childId = scene.indexOf(child);
  const childIds = parent._children?.map((entry) => entry.__id__) ?? [];
  if (!childIds.includes(childId)) {
    failures.push(`${child._name} must be a child of ${parent._name}`);
  }
}

function expectVector(vector, x, y, label) {
  if (vector?.x !== x || vector?.y !== y) {
    failures.push(`${label} must be (${x}, ${y})`);
  }
}

function expectContentSize(node, width, height) {
  const transform = findComponent(node, "cc.UITransform");
  if (
    transform?._contentSize?.width !== width ||
    transform?._contentSize?.height !== height
  ) {
    failures.push(`${node?._name} content size must be ${width}x${height}`);
  }
}

function expectSpriteFrame(node, uuid) {
  const sprite = findComponent(node, "cc.Sprite");
  if (sprite?._spriteFrame?.__uuid__ !== uuid) {
    failures.push(`${node?._name} must reference SpriteFrame ${uuid}`);
  }
}

function findComponent(node, type) {
  if (!node) {
    return null;
  }
  return node._components
    ?.map((reference) => scene[reference.__id__])
    .find((component) => component?.__type__ === type);
}

function expectCustomComponent(node, type) {
  const component = findComponent(node, type);
  if (!component) {
    failures.push(`${node?._name} must include component ${type}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(`${label} must be ${expected}, got ${actual}`);
  }
}
