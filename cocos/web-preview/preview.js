const configUrl = "../assets/resources/config/demo-gameplay.json";
const manifestUrl = "../../design/claude-design/asset-manifest.json";
const canvas = document.querySelector("#mapCanvas");
const context = canvas.getContext("2d");
const modeSelect = document.querySelector("#modeSelect");
const modeDescription = document.querySelector("#modeDescription");
const foundLabel = document.querySelector("#foundLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const targetList = document.querySelector("#targetList");
const resetButton = document.querySelector("#resetButton");
const assetBatchLabel = document.querySelector("#assetBatchLabel");
const assetStats = document.querySelector("#assetStats");
const assetList = document.querySelector("#assetList");

const targetColors = {
  pineapple: "#f3b23c",
  balloon: "#e45b68",
  thief: "#6e6a86",
  puppy: "#b9835a",
  gem: "#46a6a1",
};

let config;
let manifest;
let activeMode;
let selectedTargets = [];
let foundTargetIds = new Set();
let score = 0;

init();

async function init() {
  [config, manifest] = await Promise.all([loadConfig(), loadManifest()]);
  for (const mode of config.gameModes) {
    const option = document.createElement("option");
    option.value = mode.modeId;
    option.textContent = mode.name;
    modeSelect.append(option);
  }

  modeSelect.addEventListener("change", () => startMode(modeSelect.value));
  resetButton.addEventListener("click", () => startMode(activeMode.modeId));
  canvas.addEventListener("click", handleCanvasClick);
  startMode(config.gameModes[0].modeId);
}

async function loadConfig() {
  const response = await fetch(configUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${configUrl}`);
  }
  return response.json();
}

async function loadManifest() {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load ${manifestUrl}`);
  }
  return response.json();
}

function startMode(modeId) {
  activeMode = config.gameModes.find((mode) => mode.modeId === modeId);
  const mapConfig = config.maps.find((map) => map.mapId === activeMode.mapId);
  const pointSet = config.targetPointSets.find(
    (set) => set.targetPointSetId === mapConfig.targetPointSetId,
  );

  selectedTargets = selectTargetsForMode(activeMode, pointSet.targetPoints);
  foundTargetIds = new Set();
  score = 0;
  modeDescription.textContent = activeMode.description;
  modeSelect.value = modeId;
  render();
}

function selectTargetsForMode(mode, targetPoints) {
  const rule = mode.targetSelectionRule;
  if (rule.type === "byCategoryCounts") {
    return Object.entries(rule.countsByType).flatMap(([typeId, count]) =>
      targetPoints.filter((target) => target.typeId === typeId).slice(0, count),
    );
  }
  if (rule.type === "byTag") {
    return targetPoints
      .filter((target) => target.tags.includes(rule.tag))
      .slice(0, rule.count);
  }
  if (rule.type === "allOfType") {
    return targetPoints.filter((target) => target.typeId === rule.typeId);
  }
  return [];
}

function handleCanvasClick(event) {
  const point = getWorldPoint(event);
  const hitTarget = selectedTargets.find((target) =>
    !foundTargetIds.has(target.targetId) && isPointInTargetHitArea(target, point),
  );

  if (!hitTarget) {
    score = Math.max(0, score - getScoringRule().wrongTapPenalty);
    render(point);
    return;
  }

  foundTargetIds.add(hitTarget.targetId);
  score += hitTarget.reward.score || getScoringRule().correctHitScore;
  render(hitTarget.position);
}

function getWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const mapConfig = getMapConfig();
  return {
    x: ((event.clientX - rect.left) / rect.width) * mapConfig.worldSize.width,
    y: ((event.clientY - rect.top) / rect.height) * mapConfig.worldSize.height,
  };
}

function render(feedbackPoint) {
  const mapConfig = getMapConfig();
  resizeCanvas();
  drawMapBackground(mapConfig);
  drawTargets();
  if (feedbackPoint) {
    drawFeedback(feedbackPoint);
  }
  renderHud();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
  canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function drawMapBackground(mapConfig) {
  const rect = canvas.getBoundingClientRect();
  const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
  gradient.addColorStop(0, "#ddecda");
  gradient.addColorStop(0.55, "#f6e7bd");
  gradient.addColorStop(1, "#d9edf2");
  context.fillStyle = gradient;
  context.fillRect(0, 0, rect.width, rect.height);

  context.strokeStyle = "rgba(38, 50, 56, 0.16)";
  context.lineWidth = 1;
  for (let x = 0; x <= mapConfig.worldSize.width; x += 240) {
    const screenX = toScreenPoint({ x, y: 0 }).x;
    context.beginPath();
    context.moveTo(screenX, 0);
    context.lineTo(screenX, rect.height);
    context.stroke();
  }
  for (let y = 0; y <= mapConfig.worldSize.height; y += 200) {
    const screenY = toScreenPoint({ x: 0, y }).y;
    context.beginPath();
    context.moveTo(0, screenY);
    context.lineTo(rect.width, screenY);
    context.stroke();
  }
}

function drawTargets() {
  for (const target of selectedTargets) {
    const point = toScreenPoint(target.position);
    const isFound = foundTargetIds.has(target.targetId);
    context.globalAlpha = isFound ? 0.28 : 0.95;
    context.fillStyle = targetColors[target.typeId] ?? "#607d8b";
    context.strokeStyle = isFound ? "#ffffff" : "rgba(38, 50, 56, 0.55)";
    context.lineWidth = isFound ? 4 : 2;
    context.beginPath();
    context.arc(point.x, point.y, isFound ? 13 : 10, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.globalAlpha = 1;
  }
}

function drawFeedback(point) {
  const screenPoint = toScreenPoint(point);
  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.beginPath();
  context.arc(screenPoint.x, screenPoint.y, 24, 0, Math.PI * 2);
  context.stroke();
}

function renderHud() {
  foundLabel.textContent = `${foundTargetIds.size} / ${selectedTargets.length}`;
  scoreLabel.textContent = String(score);
  const counts = createTargetCounts();
  targetList.innerHTML = "";

  for (const [typeId, count] of counts.entries()) {
    const foundCount = selectedTargets.filter(
      (target) => target.typeId === typeId && foundTargetIds.has(target.targetId),
    ).length;
    const item = document.createElement("div");
    item.className = "target-item";
    item.innerHTML = `
      <span class="target-swatch" style="background: ${targetColors[typeId] ?? "#607d8b"}"></span>
      <span>${getTargetType(typeId)?.displayName ?? typeId}</span>
      <strong>${foundCount}/${count}</strong>
    `;
    targetList.append(item);
  }

  renderAssetPanel();
}

function renderAssetPanel() {
  assetBatchLabel.textContent = manifest.batchId;
  const counts = countAssetsByState();
  assetStats.innerHTML = "";
  for (const state of ["brief", "sourceExport", "runtimeAsset"]) {
    const item = document.createElement("div");
    item.className = "asset-stat";
    item.innerHTML = `<span>${state}</span><strong>${counts[state] ?? 0}</strong>`;
    assetStats.append(item);
  }

  assetList.innerHTML = "";
  for (const asset of getActiveModeAssets()) {
    const item = document.createElement("div");
    item.className = "asset-item";
    item.innerHTML = `
      <span>${asset.intendedUse}</span>
      <strong>${asset.runtimePath}</strong>
      <em class="asset-state">${asset.state}</em>
    `;
    assetList.append(item);
  }
}

function countAssetsByState() {
  return manifest.assets.reduce((counts, asset) => {
    counts[asset.state] = (counts[asset.state] ?? 0) + 1;
    return counts;
  }, {});
}

function getActiveModeAssets() {
  const mapConfig = getMapConfig();
  const toolAssetPaths = activeMode.toolIds
    .map((toolId) => config.tools.find((tool) => tool.toolId === toolId)?.iconAsset)
    .filter(Boolean);
  const targetAssetPaths = [...createTargetCounts().keys()].flatMap((typeId) => {
    const targetType = getTargetType(typeId);
    return [targetType?.iconAsset, targetType?.targetAsset].filter(Boolean);
  });
  const runtimePaths = [
    mapConfig.backgroundAsset,
    ...targetAssetPaths,
    ...toolAssetPaths,
  ];
  const runtimePathSet = new Set(runtimePaths);
  return manifest.assets.filter((asset) => runtimePathSet.has(asset.runtimePath));
}

function createTargetCounts() {
  const counts = new Map();
  for (const target of selectedTargets) {
    counts.set(target.typeId, (counts.get(target.typeId) ?? 0) + 1);
  }
  return counts;
}

function isPointInTargetHitArea(target, point) {
  const localPoint = {
    x: point.x - target.position.x,
    y: point.y - target.position.y,
  };
  const shape = target.hitShape;
  if (shape.type === "circle") {
    return localPoint.x * localPoint.x + localPoint.y * localPoint.y <= shape.radius * shape.radius;
  }
  if (shape.type === "rectangle") {
    return (
      Math.abs(localPoint.x) <= shape.width / 2 &&
      Math.abs(localPoint.y) <= shape.height / 2
    );
  }
  if (shape.type === "polygon") {
    return isPointInPolygon(localPoint, shape.points);
  }
  return false;
}

function isPointInPolygon(point, polygonPoints) {
  let inside = false;
  for (
    let currentIndex = 0, previousIndex = polygonPoints.length - 1;
    currentIndex < polygonPoints.length;
    previousIndex = currentIndex++
  ) {
    const current = polygonPoints[currentIndex];
    const previous = polygonPoints[previousIndex];
    const crossesY = current.y > point.y !== previous.y > point.y;
    if (!crossesY) {
      continue;
    }
    const intersectionX =
      ((previous.x - current.x) * (point.y - current.y)) /
        (previous.y - current.y) +
      current.x;
    if (point.x < intersectionX) {
      inside = !inside;
    }
  }
  return inside;
}

function toScreenPoint(point) {
  const rect = canvas.getBoundingClientRect();
  const mapConfig = getMapConfig();
  return {
    x: (point.x / mapConfig.worldSize.width) * rect.width,
    y: (point.y / mapConfig.worldSize.height) * rect.height,
  };
}

function getMapConfig() {
  return config.maps.find((map) => map.mapId === activeMode.mapId);
}

function getScoringRule() {
  return config.scoringRules.find(
    (rule) => rule.scoringRuleId === activeMode.scoringRuleId,
  );
}

function getTargetType(typeId) {
  return config.targetTypes.find((targetType) => targetType.typeId === typeId);
}
