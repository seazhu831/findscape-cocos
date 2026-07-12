import {
  applyPreviewTapUpdate,
  createAssetStateCounts,
  createPreviewModel,
  createTargetCounts,
  getActiveModeAssets,
  getTargetType,
  isPreviewComplete,
  mapToScreenPoint,
  panPreviewViewport,
  resetPreviewViewport,
  screenToMapPoint,
  setPreviewViewSize,
  zoomPreviewViewport,
} from "./preview-model.mjs";

const configUrl = "../assets/resources/config/demo-gameplay.json";
const manifestUrl = "../../design/claude-design/asset-manifest.json";
const canvas = document.querySelector("#mapCanvas");
const context = canvas.getContext("2d");
const modeSelect = document.querySelector("#modeSelect");
const modeDescription = document.querySelector("#modeDescription");
const previewError = document.querySelector("#previewError");
const roundStatusLabel = document.querySelector("#roundStatusLabel");
const foundLabel = document.querySelector("#foundLabel");
const scoreLabel = document.querySelector("#scoreLabel");
const bestScoreLabel = document.querySelector("#bestScoreLabel");
const targetList = document.querySelector("#targetList");
const feedbackLabel = document.querySelector("#feedbackLabel");
const resetButton = document.querySelector("#resetButton");
const zoomOutButton = document.querySelector("#zoomOutButton");
const zoomInButton = document.querySelector("#zoomInButton");
const resetViewButton = document.querySelector("#resetViewButton");
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
const previewBestScoreStorageKey = "findscape.webPreview.bestScores.v1";

let config;
let manifest;
let model;
let lastFeedbackPlans = [];
let bestScoresByModeId = loadBestScores();
let pointerStart;
let hasDragged = false;

init();

async function init() {
  setControlsEnabled(false);
  try {
    [config, manifest] = await Promise.all([loadConfig(), loadManifest()]);
    for (const mode of config.gameModes) {
      const option = document.createElement("option");
      option.value = mode.modeId;
      option.textContent = mode.name;
      modeSelect.append(option);
    }
    bindControls();
    startMode(config.gameModes[0].modeId);
  } catch (error) {
    showPreviewError(error);
  }
}

function bindControls() {
  modeSelect.addEventListener("change", () => startMode(modeSelect.value));
  resetButton.addEventListener("click", () => {
    if (model) {
      startMode(model.mode.modeId);
    }
  });
  zoomOutButton.addEventListener("click", () => zoomAtCanvasCenter(0.8));
  zoomInButton.addEventListener("click", () => zoomAtCanvasCenter(1.25));
  resetViewButton.addEventListener("click", () => {
    if (!model) {
      return;
    }
    model = resetPreviewViewport(model, getCanvasViewSize());
    render();
  });
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerEnd);
  canvas.addEventListener("pointercancel", handlePointerEnd);
  canvas.addEventListener("wheel", handleCanvasWheel, { passive: false });
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
  model = resetPreviewViewport(model, getCanvasViewSize());
  lastFeedbackPlans = [];
  modeDescription.textContent = model.mode.description;
  previewError.hidden = true;
  previewError.textContent = "";
  modeSelect.value = modeId;
  setControlsEnabled(true);
  render();
}

function handleCanvasClick(event) {
  if (!model) {
    return;
  }

  if (hasDragged) {
    hasDragged = false;
    return;
  }

  if (isPreviewComplete(model)) {
    return;
  }

  const point = getWorldPoint(event);
  const update = applyPreviewTapUpdate(model, point);
  model = update.model;
  lastFeedbackPlans = update.feedbackPlans;
  updateBestScore(model.mode.modeId, model.score);
  const hasCorrectHit = update.events.some((item) => item.type === "correctHit");
  render(hasCorrectHit ? point : undefined);
}

function getWorldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return screenToMapPoint(model, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
}

function handlePointerDown(event) {
  if (!model) {
    return;
  }

  pointerStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
  };
  hasDragged = false;
  canvas.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  if (!model) {
    return;
  }

  if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
    return;
  }

  const delta = {
    x: event.clientX - pointerStart.x,
    y: event.clientY - pointerStart.y,
  };
  if (Math.abs(delta.x) + Math.abs(delta.y) < 2) {
    return;
  }

  hasDragged = true;
  pointerStart = {
    ...pointerStart,
    x: event.clientX,
    y: event.clientY,
  };
  model = panPreviewViewport(model, delta);
  render();
}

function handlePointerEnd(event) {
  if (pointerStart?.pointerId === event.pointerId) {
    pointerStart = undefined;
  }
}

function handleCanvasWheel(event) {
  if (!model) {
    return;
  }

  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
  model = zoomPreviewViewport(model, model.viewport.zoom * zoomFactor, {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  });
  render();
}

function zoomAtCanvasCenter(multiplier) {
  if (!model) {
    return;
  }

  const viewSize = getCanvasViewSize();
  model = zoomPreviewViewport(model, model.viewport.zoom * multiplier, {
    x: viewSize.width / 2,
    y: viewSize.height / 2,
  });
  render();
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

function showPreviewError(error) {
  modeDescription.textContent = "Preview data could not be loaded.";
  previewError.hidden = false;
  previewError.textContent = error instanceof Error ? error.message : String(error);
  roundStatusLabel.textContent = "Unavailable";
  foundLabel.textContent = "0 / 0";
  scoreLabel.textContent = "0";
  bestScoreLabel.textContent = "0";
  feedbackLabel.textContent = "None";
  targetList.innerHTML = "";
  assetStats.innerHTML = "";
  assetList.innerHTML = "";
  setControlsEnabled(false);
}

function setControlsEnabled(isEnabled) {
  for (const control of [
    modeSelect,
    resetButton,
    zoomOutButton,
    zoomInButton,
    resetViewButton,
  ]) {
    control.disabled = !isEnabled;
  }
}

function updateBestScore(modeId, score) {
  if (score <= (bestScoresByModeId[modeId] ?? 0)) {
    return;
  }

  bestScoresByModeId = {
    ...bestScoresByModeId,
    [modeId]: score,
  };
  saveBestScores(bestScoresByModeId);
}

function loadBestScores() {
  try {
    const rawValue = window.localStorage?.getItem(previewBestScoreStorageKey);
    if (!rawValue) {
      return {};
    }
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function saveBestScores(bestScores) {
  try {
    window.localStorage?.setItem(
      previewBestScoreStorageKey,
      JSON.stringify(bestScores),
    );
  } catch {
    // Preview persistence is nice-to-have; gameplay should keep running.
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * devicePixelRatio));
  canvas.height = Math.max(1, Math.floor(rect.height * devicePixelRatio));
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  model = setPreviewViewSize(model, getCanvasViewSize());
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
  bestScoreLabel.textContent = String(bestScoresByModeId[model.mode.modeId] ?? 0);
  renderFeedbackPanel();
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

function renderFeedbackPanel() {
  if (lastFeedbackPlans.length === 0) {
    feedbackLabel.textContent = "None";
    return;
  }

  feedbackLabel.textContent = lastFeedbackPlans
    .map((plan) => {
      if (plan.kind === "settlement") {
        return `${plan.sourceEventType} score ${plan.finalScore}`;
      }
      const sound = plan.soundAsset ? `, ${plan.soundAsset}` : "";
      return `${plan.feedbackPresetId} (${plan.visuals.join("+")}${sound})`;
    })
    .join(" | ");
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
  return mapToScreenPoint(model, point);
}

function getCanvasViewSize() {
  const rect = canvas.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
  };
}
