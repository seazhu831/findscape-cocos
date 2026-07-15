import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const buildConfigPath = path.join(
  repoRoot,
  "cocos/build-config/wechatgame.json",
);
const engineConfigPath = path.join(
  repoRoot,
  "cocos/settings/v2/packages/engine.json",
);
const builderConfigPath = path.join(
  repoRoot,
  "cocos/settings/v2/packages/builder.json",
);
const resourcesMetaPath = path.join(
  repoRoot,
  "cocos/assets/resources.meta",
);
const scenePath = path.join(
  repoRoot,
  "cocos/assets/scenes/portrait-demo.scene",
);
const mangleConfigPath = path.join(repoRoot, "cocos/engine-mangle-config.json");
const failures = [];
const buildConfig = readJson(buildConfigPath);
const engineConfig = readJson(engineConfigPath);
const builderConfig = readJson(builderConfigPath);
const resourcesMeta = readJson(resourcesMetaPath);
const scene = readJson(scenePath);
const mangleConfig = readJson(mangleConfigPath);
const expectedAppId = "wx04421302f08791bc";
const expectedBundleConfigId = "findscape-wechat-subpackage";
const expectedEngineModules = [
  "2d",
  "audio",
  "base",
  "custom-pipeline",
  "gfx-webgl",
  "graphics",
  "intersection-2d",
  "tween",
  "ui",
];

expectEqual(buildConfig.taskName, "wechatgame", "taskName");
expectEqual(buildConfig.platform, "wechatgame", "platform");
expectEqual(buildConfig.buildPath, "project://build", "buildPath");
expectEqual(buildConfig.debug, false, "debug");
expectEqual(buildConfig.mangleProperties, true, "mangleProperties");
expectEqual(buildConfig.inlineEnum, true, "inlineEnum");
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
expectArrayEqual(
  engineConfig.modules?.configs?.defaultConfig?.includeModules,
  expectedEngineModules,
  "engine includeModules",
);
expectEqual(
  resourcesMeta.userData?.bundleConfigID,
  expectedBundleConfigId,
  "resources bundleConfigID",
);
const resourcesBundleConfig =
  builderConfig.bundleConfig?.custom?.[expectedBundleConfigId];
expectEqual(
  resourcesBundleConfig?.configs?.miniGame?.configMode,
  "overwrite",
  "resources mini-game config mode",
);
expectEqual(
  resourcesBundleConfig?.configs?.miniGame?.overwriteSettings?.wechatgame
    ?.compressionType,
  "subpackage",
  "resources WeChat compression type",
);
expectEqual(mangleConfig.WECHAT?.extends, "MINIGAME", "WECHAT mangle base");
if (!mangleConfig.COMMON?.dontMangleList?.includes("Component")) {
  failures.push("engine mangle config must preserve Component");
}

const sceneGlobals = scene.find((entry) => entry?.__type__ === "cc.SceneGlobals");
const skybox = scene[sceneGlobals?._skybox?.__id__];
expectEqual(skybox?._enabled, false, "scene skybox enabled state");

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
  const resourcesSubpackage = gameConfig.subpackages?.find(
    (subpackage) => subpackage.name === "resources",
  );
  expectEqual(
    resourcesSubpackage?.root,
    "subpackages/resources/",
    "generated resources subpackage root",
  );

  for (const relativePath of [
    "game.js",
    "application.js",
    "assets/main/index.js",
    "subpackages/resources/game.js",
  ]) {
    if (!isFile(path.join(outputPath, relativePath))) {
      failures.push(`generated output is missing ${relativePath}`);
    }
  }

  if (fs.existsSync(path.join(outputPath, "assets/resources"))) {
    failures.push("resources bundle must not remain in the main package");
  }

  const subpackagePath = path.join(outputPath, "subpackages/resources");
  const oggFiles = listFiles(path.join(subpackagePath, "native"))
    .filter((filePath) => filePath.endsWith(".ogg"));
  if (oggFiles.length !== 5) {
    failures.push(`generated output must contain 5 OGG files, found ${oggFiles.length}`);
  }

  const outputFiles = listFiles(outputPath);
  const forbiddenEngineArtifacts = outputFiles.filter((filePath) =>
    /(?:bullet|spine)/i.test(path.basename(filePath)),
  );
  if (forbiddenEngineArtifacts.length > 0) {
    failures.push(
      `generated output contains unused engine artifacts: ${forbiddenEngineArtifacts
        .map((filePath) => path.relative(outputPath, filePath))
        .join(", ")}`,
    );
  }

  const outputBytes = sumFileBytes(outputFiles);
  const mainPackageFiles = outputFiles.filter(
    (filePath) => !filePath.startsWith(`${path.join(outputPath, "subpackages")}${path.sep}`),
  );
  const mainPackageBytes = sumFileBytes(mainPackageFiles);
  const mainPackageLimitBytes = 4 * 1024 * 1024;
  if (mainPackageBytes > mainPackageLimitBytes) {
    failures.push(
      `generated main package is ${formatMiB(mainPackageBytes)}, above the ${formatMiB(mainPackageLimitBytes)} WeChat limit`,
    );
  }

  const subpackageBytes = sumFileBytes(listFiles(path.join(outputPath, "subpackages")));
  const subpackageLimitBytes = 20 * 1024 * 1024;
  if (subpackageBytes > subpackageLimitBytes) {
    failures.push(
      `generated subpackages are ${formatMiB(subpackageBytes)}, above the ${formatMiB(subpackageLimitBytes)} limit`,
    );
  }

  const currentRegressionLimitBytes = 7 * 1024 * 1024;
  if (outputBytes > currentRegressionLimitBytes) {
    failures.push(
      `generated output is ${formatMiB(outputBytes)}, above the current ${formatMiB(currentRegressionLimitBytes)} regression limit`,
    );
  }
}

function sumFileBytes(filePaths) {
  return filePaths.reduce(
    (total, filePath) => total + fs.statSync(filePath).size,
    0,
  );
}

function expectEqual(actual, expected, label) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, got ${actual}`);
  }
}

function expectArrayEqual(actual, expected, label) {
  const normalizedActual = Array.isArray(actual) ? [...actual].sort() : actual;
  const normalizedExpected = [...expected].sort();
  if (JSON.stringify(normalizedActual) !== JSON.stringify(normalizedExpected)) {
    failures.push(
      `${label}: expected ${JSON.stringify(normalizedExpected)}, got ${JSON.stringify(normalizedActual)}`,
    );
  }
}

function formatMiB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
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
  return fs.readdirSync(rootPath, { recursive: true })
    .map((relativePath) => path.join(rootPath, relativePath))
    .filter((filePath) => fs.statSync(filePath).isFile());
}
