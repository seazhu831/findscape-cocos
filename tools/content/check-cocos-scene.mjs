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
const feedbackSourcePath = path.join(
  cocosRoot,
  "assets/scripts/feedback/portrait-feedback.ts",
);
const audioFeedbackSourcePath = path.join(
  cocosRoot,
  "assets/scripts/feedback/portrait-audio-feedback.ts",
);
const targetPresentationSourcePath = path.join(
  cocosRoot,
  "assets/scripts/feedback/portrait-target-presentation.ts",
);
const roundSceneSourcePath = path.join(
  cocosRoot,
  "assets/scripts/app/portrait-round-scene.ts",
);
const sceneEntityBinderSourcePath = path.join(
  cocosRoot,
  "assets/scripts/gameplay/portrait-scene-entity-binder.ts",
);
const entityMotionSourcePath = path.join(
  cocosRoot,
  "assets/scripts/gameplay/portrait-entity-motion.ts",
);
const runtimeStorageSourcePath = path.join(
  cocosRoot,
  "assets/scripts/platform/runtime-storage.ts",
);
const roundViewModelSourcePath = path.join(
  cocosRoot,
  "assets/scripts/ui/round-view-model.ts",
);
const settlementSourcePath = path.join(
  cocosRoot,
  "assets/scripts/ui/portrait-settlement.ts",
);
const modeSelectSourcePath = path.join(
  cocosRoot,
  "assets/scripts/ui/portrait-mode-select.ts",
);
const failures = [];

const scene = JSON.parse(fs.readFileSync(scenePath, "utf8"));
const projectSettings = JSON.parse(
  fs.readFileSync(projectSettingsPath, "utf8"),
);
const hudSource = fs.readFileSync(hudSourcePath, "utf8");
const feedbackSource = fs.readFileSync(feedbackSourcePath, "utf8");
const audioFeedbackSource = fs.readFileSync(audioFeedbackSourcePath, "utf8");
const targetPresentationSource = fs.readFileSync(
  targetPresentationSourcePath,
  "utf8",
);
const roundSceneSource = fs.readFileSync(roundSceneSourcePath, "utf8");
const sceneEntityBinderSource = fs.readFileSync(
  sceneEntityBinderSourcePath,
  "utf8",
);
const entityMotionSource = fs.readFileSync(entityMotionSourcePath, "utf8");
const runtimeStorageSource = fs.readFileSync(runtimeStorageSourcePath, "utf8");
const roundViewModelSource = fs.readFileSync(roundViewModelSourcePath, "utf8");
const settlementSource = fs.readFileSync(settlementSourcePath, "utf8");
const modeSelectSource = fs.readFileSync(modeSelectSourcePath, "utf8");
const nodes = scene.filter((entry) => entry?.__type__ === "cc.Node");
const nodesByName = new Map(nodes.map((node) => [node._name, node]));

expectEqual(projectSettings.general?.designResolution?.width, 1080, "design width");
expectEqual(projectSettings.general?.designResolution?.height, 1920, "design height");

const canvas = requireNode("Canvas");
const camera = requireNode("Camera");
const mapWorld = requireNode("MapWorld");
const map = requireNode("Map");
const feedbackRoot = requireNode("FeedbackRoot");
const hudRoot = requireNode("HUDRoot");
expectChild(canvas, camera);
expectCustomComponent(canvas, "dfdb9uPrQtM/LZZJc/8ZKb7");
expectChild(canvas, mapWorld);
expectChild(canvas, feedbackRoot);
expectChild(canvas, hudRoot);
expectChildOrder(canvas, [mapWorld, feedbackRoot, hudRoot]);
expectChild(mapWorld, map);
expectVector(mapWorld?._lscale, 1, 1, "MapWorld scale");
expectContentSize(map, 1600, 2400);
expectSpriteFrame(map, "adf71751-5e84-4cd7-9d68-3165f4a4c543@f9941");
expectContentSize(hudRoot, 1080, 1920);
expectCustomComponent(hudRoot, "9d6986zY6tFNYfqeaJhWbx/");
expectContentSize(feedbackRoot, 1080, 1920);
expectCustomComponent(feedbackRoot, "3685euzn7RPLb3IeRmV1Oxb");
for (const requiredHudContract of [
  '"TopBar"',
  '"TargetPanel"',
  '"HintButton"',
  '"MagnifierButton"',
  "new Vec3(0, 830, 0)",
  "new Vec3(0, -820, 0)",
  "new Vec3(-430, -620, 0)",
  "new Vec3(430, -620, 0)",
  "const slotXs = [-300, -150, 0, 150, 300]",
  '"TargetPanelToggle"',
  "this.targetPanel.active = this.targetPanelExpanded",
  "opacity.opacity = active ? 48 : 255",
  '"UsesBadge"',
  '"CooldownPill"',
  "viewModel.tools.find",
  "tool?.isDepleted ? 110 : tool?.isCoolingDown ? 170 : 255",
  "viewModel.status === \"playing\" ? viewModel.timer.urgency : \"normal\"",
  "Tween.stopAllByTarget(this.timerNode)",
  'urgency === "critical"',
  ".repeatForever()",
  "pendingFoundCountsByType.get(item.typeId)",
  "public getTargetArrivalNode(typeId: string)",
  "this.targetPanelExpanded && this.targetPanel?.active && slot?.active",
  "public playTargetArrival(typeId: string, durationSeconds: number)",
  "Tween.stopAllByTarget(arrivalNode)",
]) {
  if (!hudSource.includes(requiredHudContract)) {
    failures.push(`PortraitHud is missing contract: ${requiredHudContract}`);
  }
}

for (const requiredFeedbackContract of [
  "this.playFindSuccess(target)",
  "this.playBalloonPop(target)",
  "this.playCatchPulse(target)",
  "public playWrongAt(localPosition: Vec3)",
  "public playHint(target: Node, durationSeconds = 2)",
  "this.animateEffect(effect, 0.7",
  "this.animateEffect(effect, 0.5",
  "this.animateEffect(effect, 0.8",
  ".to(0.3, { scale:",
  ".call(() => effect.destroy())",
]) {
  if (!feedbackSource.includes(requiredFeedbackContract)) {
    failures.push(`PortraitFeedback is missing contract: ${requiredFeedbackContract}`);
  }
}

for (const requiredAudioFeedbackContract of [
  'resources.load(soundAsset, AudioClip',
  "this.audioSource.playOneShot(clip, command.volume)",
  "[FindscapeAudio] Loaded ${this.clipsByPath.size}/${uniquePaths.length} clips",
  "[FindscapeAudio] Missing clip ${command.soundAsset}",
  "console.warn(",
  "resolve();",
]) {
  if (!audioFeedbackSource.includes(requiredAudioFeedbackContract)) {
    failures.push(
      `PortraitAudioFeedback is missing contract: ${requiredAudioFeedbackContract}`,
    );
  }
}

for (const requiredTargetPresentationContract of [
  'new Node("TargetPresentationRoot")',
  'new Node("TargetFlightProxy")',
  "targetVisual.worldPosition",
  "destinationNode.worldPosition",
  "targetVisual.worldScale",
  "targetNode.active = false",
  "Math.max(source.y, destination.y) + 190",
  "this.hud.playTargetArrival(plan.typeId, arrivalSeconds)",
  "Tween.stopAllByTarget(active.node)",
  "generation === this.generation",
]) {
  if (!targetPresentationSource.includes(requiredTargetPresentationContract)) {
    failures.push(
      `PortraitTargetPresentation is missing contract: ${requiredTargetPresentationContract}`,
    );
  }
}

for (const requiredRoundSceneContract of [
  'const DEFAULT_MODE_ID = "hidden_object_demo"',
  "applyDemoSessionTap",
  "applyDemoSessionTick",
  "applyDemoSessionHint",
  "applyDemoSessionMagnifier",
  "this.sceneEntityRegistry?.projectMode(",
  "this.sceneEntityBinder?.apply(this.sceneEntityRegistry)",
  "this.sceneEntityRegistry?.markTargetFound(",
  "this.sceneEntityBinder?.getTargetIdForNode(targetNode)",
  "createEntityMotionSchedule(",
  "this.entityMotion.play(schedule, this.sceneEntityBinder)",
  "this.entityMotion.stopEntity(foundEntity.entity.entityId)",
  "new PortraitTargetPresentation(this.node, this.hud)",
  "startTargetPresentation(",
  "correctHit.isRoundComplete",
  "this.targetPresentation?.play(",
  "completeTargetPresentation(",
  "this.targetPresentationState.settlementPending",
  "this.getPendingFoundCountsByType()",
  "this.targetPresentation?.cancelAll()",
  "cancelTargetPresentations(",
  "event.propagationStopped = true",
  "x: mapLocal.x + mapSize.width / 2",
  "y: mapSize.height / 2 - mapLocal.y",
  "this.hud?.render(viewModel.hud,",
  "this.feedback?.playTarget(targetNode)",
  "this.feedback?.playWrongAt(feedbackLocal)",
  "this.feedback?.playHint(targetNode, hintEvent.durationSeconds)",
  "this.node.addComponent(PortraitAudioFeedback)",
  "await this.audioFeedback.preload(",
  "this.audioFeedback?.playPlans(update.feedbackPlans)",
  'new Node("SettlementRoot")',
  "this.settlement?.show(",
  "this.setToolsVisible(!viewModel.settlement)",
  'this.sessionState.screen !== "round"',
  "createRuntimeStoragePort({",
  "browserStorage: sys.localStorage",
  "[FindscapeStorage] Using ${storage.platform} storage",
  "loadLocalSaveFromStorage(this.storagePort)",
  "createInitialDemoSessionState(saveData)",
  'this.sessionState?.screen === "round"',
  'update.state.screen === "settlement"',
  "saveLocalSaveToStorage(",
  "this.settlement.getRetryButton().on(",
  'this.sessionState.screen !== "settlement"',
  "this.sessionState.selectedModeId ?? DEFAULT_MODE_ID",
  "this.resetTargetVisuals()",
  "returnToModeSelect(this.sessionState)",
  'new Node("ModeSelectRoot")',
  "this.modeSelect.show(",
  'name.replace("ModeButton_", "")',
  "this.configureRoundTargets()",
  "returnToModeSelect(",
  "this.sessionState.saveData.bestByModeId",
  "best.updatedAtUnixMs === this.sessionState.lastResult.completedAtUnixMs",
  "Tween.stopAllByTarget(targetNode)",
  "Tween.stopAllByTarget(opacity)",
  'toolIds.has("magnifier")',
  "this.handleMagnifierTouch",
  "this.handleTargetPanelToggleTouch",
  "this.hud?.setMapInteractionActive(true)",
  "this.hud?.setMapInteractionActive(false)",
  "this.hud?.toggleTargetPanel()",
  'toolEvent.type === "magnifierZoom"',
  "magnifierEvent.zoomMultiplier",
  "magnifierEvent.durationSeconds",
  "Tween.stopAllByTarget(this.mapWorld)",
  "Node.EventType.TOUCH_START",
  "Node.EventType.TOUCH_MOVE",
  "Node.EventType.TOUCH_CANCEL",
  "event.getUIDelta()",
  "this.mapGestureDistance < DRAG_THRESHOLD",
  "view.getVisibleSize()",
  "panFocusCamera(this.focusCameraState, delta)",
  "beginCameraFocus(this.focusCameraState, zoomMultiplier)",
  "beginCameraRestore(this.focusCameraState)",
  "completeCameraTransition(",
  "cancelCameraFocus(this.focusCameraState)",
  "this.cameraViewportToNodeTransform(update.transition.to)",
  "this.applyCameraViewport(this.focusCameraState.viewport)",
  "if (this.mapGestureDragged)",
  "this.resetMapPosition()",
  'this.focusCameraState?.phase !== "idle"',
  'this.showLoadState("loading")',
  'this.showLoadState("error")',
  'new Node("LoadStateRoot")',
  "root.addComponent(BlockInputEvents)",
  'label.string = state === "error" ? "UNABLE TO START" : "LOADING"',
  "this.hideLoadState()",
]) {
  if (!roundSceneSource.includes(requiredRoundSceneContract)) {
    failures.push(`PortraitRoundScene is missing contract: ${requiredRoundSceneContract}`);
  }
}

for (const requiredSceneEntityBinderContract of [
  "for (const layer of SCENE_LAYER_ORDER)",
  "`SceneLayer_${layer}`",
  'this.bindBackground()',
  'this.rootsByLayer.get("background")',
  'this.findExistingNode(state.targetId, state.entity.entityId)',
  'await this.createEntityNode(state.entity)',
  'resources.load(`${assetPath}/spriteFrame`, SpriteFrame',
  'entity.transform.position.x - map.worldSize.width / 2',
  'map.worldSize.height / 2 - entity.transform.position.y',
  'node.active = state.active',
  'this.sortLayerChildren()',
  'new Node("SceneEntityVisual")',
  'sourceSprite.enabled = false',
  'getVisualNodeByEntityId(entityId: string)',
]) {
  if (!sceneEntityBinderSource.includes(requiredSceneEntityBinderContract)) {
    failures.push(
      `PortraitSceneEntityBinder is missing contract: ${requiredSceneEntityBinderContract}`,
    );
  }
}

for (const requiredEntityMotionContract of [
  'plan.variant.driver === "spriteFrames"',
  'this.playAnimationClip(',
  'binder.getVisualNodeByEntityId(plan.entityId)',
  'offset.x, -offset.y, 0',
  'sequence.repeatForever(cycle)',
  'AnimationClip.createWithSpriteFrames(',
  '`${assetPath}/spriteFrame`',
  'this.isCurrent(plan.entityId, generation, version)',
  'animation.removeClip(clip, true)',
  'Tween.stopAllByTarget(visual)',
  'visual.setPosition(0, 0, 0)',
]) {
  if (!entityMotionSource.includes(requiredEntityMotionContract)) {
    failures.push(
      `PortraitEntityMotion is missing contract: ${requiredEntityMotionContract}`,
    );
  }
}

for (const requiredRuntimeStorageContract of [
  'platform: "wechat"',
  'platform: "browser"',
  "createWeChatStoragePort(wechatStorage)",
  "createBrowserStoragePort(environment.browserStorage)",
  'typeof candidate?.getStorage !== "function"',
  'typeof candidate.setStorage !== "function"',
  'typeof candidate.removeStorage !== "function"',
]) {
  if (!runtimeStorageSource.includes(requiredRuntimeStorageContract)) {
    failures.push(
      `Runtime storage selector is missing contract: ${requiredRuntimeStorageContract}`,
    );
  }
}

for (const requiredSettlementContract of [
  "class PortraitSettlement extends Component",
  "viewModel.starRating",
  "viewModel.accuracy01",
  "addComponent(BlockInputEvents)",
  'viewModel.status === "completed"',
  '"RetryButton"',
  '"REPLAY"',
  '"BestScore"',
  '"NEW BEST"',
  "public getRetryButton(): Node",
  '"ModesButton"',
  '"MODES"',
  "public getModesButton(): Node",
]) {
  if (!settlementSource.includes(requiredSettlementContract)) {
    failures.push(
      `PortraitSettlement is missing contract: ${requiredSettlementContract}`,
    );
  }
}


for (const requiredModeSelectContract of [
  "class PortraitModeSelect extends Component",
  '"CHOOSE MODE"',
  "summary.selectedTargetCount",
  "summary.targetSelectionLabel",
  '"BEST --"',
  "bestByModeId[summary.modeId]",
  '`ModeButton_${summary.modeId}`',
  "addComponent(BlockInputEvents)",
]) {
  if (!modeSelectSource.includes(requiredModeSelectContract)) {
    failures.push(
      `PortraitModeSelect is missing contract: ${requiredModeSelectContract}`,
    );
  }
}

if (!roundViewModelSource.includes("Array.from(requiredCounts.entries())")) {
  failures.push(
    "Round view model must use Array.from for Creator-compatible Map iteration",
  );
}
for (const requiredToolViewModelContract of [
  "export interface ToolHudViewModel",
  "toolRuntimeState?: ToolRuntimeState",
  "Math.ceil(state?.cooldownRemainingSeconds ?? 0)",
  "isCoolingDown: cooldownSeconds > 0 && usesRemaining > 0",
  "isDepleted: usesRemaining <= 0",
]) {
  if (!roundViewModelSource.includes(requiredToolViewModelContract)) {
    failures.push(`Round view model is missing contract: ${requiredToolViewModelContract}`);
  }
}

const targets = [
  ["demo_pineapple_001", -470, 340, "3f49362c-1baf-4c1a-9811-d452db44fdd8@f9941"],
  ["demo_puppy_001", -320, -780, "9361326b-50ac-477e-b7e2-e631b04b44a2@f9941"],
  ["demo_balloon_001", 130, 840, "2c49839c-1bd2-4074-bbad-09a12ad19c04@f9941"],
  ["demo_thief_001", 260, -110, "60c6743f-c87f-4184-8bf5-788e7f381ea9@f9941"],
  ["demo_pineapple_002", 530, 160, "3f49362c-1baf-4c1a-9811-d452db44fdd8@f9941"],
  ["demo_gem_001", 400, -890, "ada04348-94d2-4f71-a139-e189ee53b468@f9941"],
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

function expectChildOrder(parent, orderedChildren) {
  if (!parent || orderedChildren.some((child) => !child)) {
    return;
  }
  const childIds = parent._children?.map((entry) => entry.__id__) ?? [];
  const indexes = orderedChildren.map((child) => childIds.indexOf(scene.indexOf(child)));
  if (indexes.some((index) => index < 0) || indexes.some((index, offset) => offset > 0 && index <= indexes[offset - 1])) {
    failures.push(
      `${orderedChildren.map((child) => child._name).join(" -> ")} must keep sibling order`,
    );
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
