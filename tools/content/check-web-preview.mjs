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
  "web-preview/styles.css",
  "web-preview/README.md",
  "assets/resources/config/demo-gameplay.json",
];

for (const requiredFile of requiredFiles) {
  if (!fileExists(path.join(cocosRoot, requiredFile))) {
    failures.push(`Missing web preview file: ${requiredFile}`);
  }
}

const packageJson = JSON.parse(
  fs.readFileSync(path.join(cocosRoot, "package.json"), "utf8"),
);
if (packageJson.scripts?.["preview:web"] !== "python3 -m http.server 4173 --bind 127.0.0.1") {
  failures.push(
    "package.json must define preview:web as python3 -m http.server 4173 --bind 127.0.0.1",
  );
}
if (!packageJson.scripts?.["check:web-preview"]) {
  failures.push("package.json must define check:web-preview");
}

const html = readText("web-preview/index.html");
const js = readText("web-preview/preview.js");
const css = readText("web-preview/styles.css");

if (!html.includes('<canvas id="mapCanvas"')) {
  failures.push("web-preview/index.html must include #mapCanvas");
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
for (const requiredFunction of [
  "selectTargetsForMode",
  "isPointInTargetHitArea",
  "isPointInPolygon",
]) {
  if (!js.includes(`function ${requiredFunction}`)) {
    failures.push(`preview.js must define ${requiredFunction}`);
  }
}
if (!css.includes("@media (max-width: 820px)")) {
  failures.push("styles.css must include a mobile layout breakpoint");
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
