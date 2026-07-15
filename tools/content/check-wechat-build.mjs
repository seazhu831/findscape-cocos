import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const buildConfigPath = path.join(
  repoRoot,
  "cocos/build-config/wechatgame.json",
);
const failures = [];
const buildConfig = readJson(buildConfigPath);
const expectedAppId = "wx04421302f08791bc";

expectEqual(buildConfig.taskName, "wechatgame", "taskName");
expectEqual(buildConfig.platform, "wechatgame", "platform");
expectEqual(buildConfig.buildPath, "project://build", "buildPath");
expectEqual(
  buildConfig.packages?.wechatgame?.appid,
  expectedAppId,
  "packages.wechatgame.appid",
);
expectEqual(
  buildConfig.packages?.wechatgame?.orientation,
  "portrait",
  "packages.wechatgame.orientation",
);

const outputArgIndex = process.argv.indexOf("--output");
if (outputArgIndex >= 0) {
  const outputArg = process.argv[outputArgIndex + 1];
  if (!outputArg) {
    failures.push("--output requires a directory");
  } else {
    validateOutput(path.resolve(process.cwd(), outputArg));
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  outputArgIndex >= 0
    ? "Validated WeChat build config and generated output"
    : "Validated WeChat build config",
);

function validateOutput(outputPath) {
  const projectConfig = readJson(path.join(outputPath, "project.config.json"));
  const gameConfig = readJson(path.join(outputPath, "game.json"));
  expectEqual(projectConfig.appid, expectedAppId, "generated appid");
  expectEqual(projectConfig.compileType, "game", "generated compileType");
  expectEqual(gameConfig.deviceOrientation, "portrait", "generated orientation");

  for (const relativePath of [
    "game.js",
    "application.js",
    "assets/main/index.js",
    "assets/resources/index.js",
  ]) {
    if (!isFile(path.join(outputPath, relativePath))) {
      failures.push(`generated output is missing ${relativePath}`);
    }
  }

  const oggFiles = listFiles(path.join(outputPath, "assets/resources/native"))
    .filter((filePath) => filePath.endsWith(".ogg"));
  if (oggFiles.length !== 5) {
    failures.push(`generated output must contain 5 OGG files, found ${oggFiles.length}`);
  }
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    failures.push(`unable to read ${path.relative(repoRoot, filePath)}: ${error.message}`);
    return {};
  }
}

function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function listFiles(rootPath) {
  if (!fs.existsSync(rootPath)) {
    return [];
  }
  return fs.readdirSync(rootPath, { recursive: true }).map((relativePath) =>
    path.join(rootPath, relativePath),
  );
}
