import {
  applyPreviewTap,
  createAssetStateCounts,
  createPreviewModel,
  createTargetCounts,
  getActiveModeAssets,
  getTargetType,
  isPreviewComplete,
} from "./preview-model.mjs";

const configUrl = "../assets/resources/config/demo-gameplay.json";
const manifestUrl = "../../design/claude-design/asset-manifest.json";
const canvas = document.querySelector("#mapCanvas");
const context = canvas.getContext("2d");
const modeSelect = document.querySelector("#modeSelect");
const modeDescription = document.querySelector("#modeDescription");
const roundStatusLabel = document.querySelector("#roundStatusLabel");
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
let model;

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
  resetButton.addEventListener("click", () => startMode(model.mode.modeId));
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
  model = createPreviewModel(config, manifest, modeId);
  modeDescription.textContent = model.mode.description;
  modeSelect.value = modeId;
  render();
}

function handleCanvasClick(event) {
  if (isPreviewComplete(model)) {
    return;
  }

  const point = getWorldPoint(event);
  const previousFoundCount = model.foundTargetIds.size;
  model = applyPreviewTap(model, point);
  render(model.foundTargetIds.size > previousFoundCount ? point : undefined);
}

function getWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * model.mapConfig.worldSize.width,
    y: ((event.clientY - rect.top) / rect.height) * model.mapConfig.worldSize.height,
  };
}

function render(feedbackPoint) {
  resizeCanvas();
  drawMapBackground(model.mapConfig);
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
  for (const target of model.selectedTargets) {
    const point = toScreenPoint(target.position);
    const isFound = model.foundTargetIds.has(target.targetId);
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
  renderRoundStatus();
  foundLabel.textContent = `${model.foundTargetIds.size} / ${model.selectedTargets.length}`;
  scoreLabel.textContent = String(model.score);
  const counts = createTargetCounts(model);
  targetList.innerHTML = "";

  for (const [typeId, count] of counts.entries()) {
    const foundCount = model.selectedTargets.filter(
      (target) => target.typeId === typeId && model.foundTargetIds.has(target.targetId),
    ).length;
    const item = document.createElement("div");
    item.className = "target-item";
    item.innerHTML = `
      <span class="target-swatch" style="background: ${targetColors[typeId] ?? "#607d8b"}"></span>
      <span>${getTargetType(model, typeId)?.displayName ?? typeId}</span>
      <strong>${foundCount}/${count}</strong>
    `;
    targetList.append(item);
  }

  renderAssetPanel();
}

function renderRoundStatus() {
  const isComplete = isPreviewComplete(model);
  roundStatusLabel.textContent = isComplete ? "Complete" : "Playing";
  roundStatusLabel.classList.toggle("is-complete", isComplete);
}

function renderAssetPanel() {
  assetBatchLabel.textContent = manifest.batchId;
  const counts = createAssetStateCounts(manifest);
  assetStats.innerHTML = "";
  for (const state of ["brief", "sourceExport", "runtimeAsset"]) {
    const item = document.createElement("div");
    item.className = "asset-stat";
    item.innerHTML = `<span>${state}</span><strong>${counts[state] ?? 0}</strong>`;
    assetStats.append(item);
  }

  assetList.innerHTML = "";
  for (const asset of getActiveModeAssets(model)) {
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

function toScreenPoint(point) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (point.x / model.mapConfig.worldSize.width) * rect.width,
    y: (point.y / model.mapConfig.worldSize.height) * rect.height,
  };
}
