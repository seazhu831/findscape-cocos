import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const cocosRoot = path.join(repoRoot, "cocos");
const failures = [];

const requiredFiles = [
  "web-preview/index.html",
  "web-preview/preview.js",
  "web-preview/preview-model.mjs",
  "web-preview/styles.css",
  "web-preview/README.md",
  "assets/resources/config/demo-gameplay.json",
  "../design/claude-design/asset-manifest.json",
];

for (const requiredFile of requiredFiles) {
  if (!fileExists(path.resolve(cocosRoot, requiredFile))) {
    failures.push(`Missing web preview file: ${requiredFile}`);
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(cocosRoot, "package.json"), "utf8"),
);
if (packageJson.scripts?.["preview:web"] !== "python3 -m http.server 4173 --bind 127.0.0.1 --directory ..") {
  failures.push(
    "package.json must define preview:web as python3 -m http.server 4173 --bind 127.0.0.1 --directory ..",
  );
}
if (!packageJson.scripts?.["check:web-preview"]) {
  failures.push("package.json must define check:web-preview");
}

const html = readText("web-preview/index.html");
const js = readText("web-preview/preview.js");
const model = readText("web-preview/preview-model.mjs");
const css = readText("web-preview/styles.css");

if (!html.includes('<canvas id="mapCanvas"')) {
  failures.push("web-preview/index.html must include #mapCanvas");
}
for (const requiredElement of [
  'id="roundStatusLabel"',
  'id="assetBatchLabel"',
  'id="assetStats"',
  'id="assetList"',
]) {
  if (!html.includes(requiredElement)) {
    failures.push(`web-preview/index.html must include ${requiredElement}`);
  }
}
if (!html.includes('src="./preview.js"')) {
  failures.push("web-preview/index.html must load preview.js");
}
if (!html.includes('href="./styles.css"')) {
  failures.push("web-preview/index.html must load styles.css");
}
if (!html.includes('rel="icon" href="data:,"')) {
  failures.push("web-preview/index.html must define an empty favicon");
}
if (!js.includes("../assets/resources/config/demo-gameplay.json")) {
  failures.push("preview.js must load demo-gameplay.json");
}
if (!js.includes("../../design/claude-design/asset-manifest.json")) {
  failures.push("preview.js must load asset-manifest.json");
}
if (!js.includes("./preview-model.mjs")) {
  failures.push("preview.js must import preview-model.mjs");
}
for (const requiredFunction of ["renderRoundStatus", "renderAssetPanel"]) {
  if (!js.includes(`function ${requiredFunction}`)) {
    failures.push(`preview.js must define ${requiredFunction}`);
  }
}
for (const requiredFunction of [
  "selectTargetsForMode",
  "isPointInTargetHitArea",
  "isPointInPolygon",
  "isPreviewComplete",
  "getActiveModeAssets",
]) {
  if (!model.includes(`function ${requiredFunction}`)) {
    failures.push(`preview-model.mjs must define ${requiredFunction}`);
  }
}
if (!css.includes("@media (max-width: 820px)")) {
  failures.push("styles.css must include a mobile layout breakpoint");
}
if (!css.includes(".asset-panel")) {
  failures.push("styles.css must style the asset panel");
}
if (!css.includes(".round-status.is-complete")) {
  failures.push("styles.css must style the complete round status");
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated static web preview scaffold");

function readText(relativePath) {
  return fs.readFileSync(path.join(cocosRoot, relativePath), "utf8");
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
