import {
  _decorator,
  BlockInputEvents,
  Color,
  Component,
  EventTouch,
  Graphics,
  JsonAsset,
  Label,
  Node,
  resources,
  sys,
  tween,
  Tween,
  UIOpacity,
  UITransform,
  Vec3,
  view,
} from "cc";
import {
  applyDemoSessionHint,
  applyDemoSessionMagnifier,
  applyDemoSessionTap,
  applyDemoSessionTick,
  createDemoSessionContext,
  createInitialDemoSessionState,
  returnToModeSelect,
  startDemoRound,
  type DemoSessionContext,
  type DemoSessionState,
  type DemoSessionUpdate,
} from "./demo-session";
import type {
  GameplayConfig,
  MapConfig,
  TargetPointConfig,
} from "../config/gameplay-schema";
import { PortraitAudioFeedback } from "../feedback/portrait-audio-feedback";
import { PortraitFeedback } from "../feedback/portrait-feedback";
import { createEntityMotionSchedule } from "../gameplay/entity-motion-scheduler";
import { PortraitEntityMotion } from "../gameplay/portrait-entity-motion";
import { PortraitSceneEntityBinder } from "../gameplay/portrait-scene-entity-binder";
import { SceneEntityRegistry } from "../gameplay/scene-entity-runtime";
import { PortraitHud } from "../ui/portrait-hud";
import { PortraitModeSelect } from "../ui/portrait-mode-select";
import { PortraitSettlement } from "../ui/portrait-settlement";
import { createRuntimeStoragePort } from "../platform/runtime-storage";
import {
  loadLocalSaveFromStorage,
  saveLocalSaveToStorage,
  type KeyValueStoragePort,
} from "../storage/storage-port";

const { ccclass } = _decorator;
const DEFAULT_MODE_ID = "hidden_object_demo";
const DRAG_THRESHOLD = 12;
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 2400;

@ccclass("PortraitRoundScene")
export class PortraitRoundScene extends Component {
  private sessionContext: DemoSessionContext | null = null;
  private sessionState: DemoSessionState | null = null;
  private mapWorld: Node | null = null;
  private feedback: PortraitFeedback | null = null;
  private audioFeedback: PortraitAudioFeedback | null = null;
  private hud: PortraitHud | null = null;
  private settlement: PortraitSettlement | null = null;
  private modeSelect: PortraitModeSelect | null = null;
  private storagePort: KeyValueStoragePort | null = null;
  private sceneEntityRegistry: SceneEntityRegistry | null = null;
  private sceneEntityBinder: PortraitSceneEntityBinder | null = null;
  private readonly entityMotion = new PortraitEntityMotion();
  private targetNodesById = new Map<string, Node>();
  private targetConfigsById = new Map<string, TargetPointConfig>();
  private ready = false;
  private modeButtonsBound = false;
  private mapGestureActive = false;
  private mapGestureDragged = false;
  private mapGestureDistance = 0;
  private magnifierZoomActive = false;
  private loadStateRoot: Node | null = null;

  protected start(): void {
    this.showLoadState("loading");
    void this.initialize()
      .then(() => {
        this.hideLoadState();
      })
      .catch((error) => {
        console.error("[PortraitRoundScene] Initialization failed", error);
        this.showLoadState("error");
      });
  }

  protected update(deltaTime: number): void {
    if (!this.ready || !this.sessionState || this.sessionState.screen !== "round") {
      return;
    }

    const update = applyDemoSessionTick(this.sessionState, deltaTime, {
      completedAtUnixMs: Date.now(),
    });
    this.applySessionUpdate(update);
    this.renderHud();
  }

  protected onDestroy(): void {
    this.mapWorld?.off(Node.EventType.TOUCH_START, this.handleMapTouchStart, this);
    this.mapWorld?.off(Node.EventType.TOUCH_MOVE, this.handleMapTouchMove, this);
    this.mapWorld?.off(Node.EventType.TOUCH_END, this.handleMapTouch, this);
    this.mapWorld?.off(Node.EventType.TOUCH_CANCEL, this.handleMapTouchCancel, this);
    for (const target of this.targetNodesById.values()) {
      target.off(Node.EventType.TOUCH_END, this.handleTargetTouch, this);
    }
    this.hud?.getHintButton()?.off(
      Node.EventType.TOUCH_END,
      this.handleHintTouch,
      this,
    );
    this.hud?.getMagnifierButton()?.off(
      Node.EventType.TOUCH_END,
      this.handleMagnifierTouch,
      this,
    );
    this.hud?.getTargetPanelToggle()?.off(
      Node.EventType.TOUCH_END,
      this.handleTargetPanelToggleTouch,
      this,
    );
    this.settlement?.getRetryButton().off(
      Node.EventType.TOUCH_END,
      this.handleRetryTouch,
      this,
    );
    this.settlement?.getModesButton().off(
      Node.EventType.TOUCH_END,
      this.handleModesTouch,
      this,
    );
    for (const button of this.modeSelect?.getModeButtons().values() ?? []) {
      button.off(Node.EventType.TOUCH_END, this.handleModeTouch, this);
    }
    this.entityMotion.stopAll();
    this.sceneEntityBinder?.dispose();
    this.stopMagnifierZoom();
    this.hideLoadState();
  }

  private async initialize(): Promise<void> {
    this.mapWorld = this.node.getChildByName("MapWorld");
    this.feedback = this.node
      .getChildByName("FeedbackRoot")
      ?.getComponent(PortraitFeedback) ?? null;
    this.hud = this.node.getChildByName("HUDRoot")?.getComponent(PortraitHud) ?? null;
    if (!this.mapWorld || !this.feedback || !this.hud) {
      throw new Error("MapWorld, FeedbackRoot, and HUDRoot are required");
    }
    this.audioFeedback =
      this.node.getComponent(PortraitAudioFeedback) ??
      this.node.addComponent(PortraitAudioFeedback);
    this.settlement = this.createSettlement();
    this.modeSelect = this.createModeSelect();
    this.settlement.getRetryButton().on(
      Node.EventType.TOUCH_END,
      this.handleRetryTouch,
      this,
    );
    this.settlement.getModesButton().on(
      Node.EventType.TOUCH_END,
      this.handleModesTouch,
      this,
    );

    const config = await this.loadGameplayConfig();
    await this.audioFeedback.preload(
      config.feedbackPresets.flatMap((preset) =>
        preset.soundAsset ? [preset.soundAsset] : [],
      ),
    );
    const storage = createRuntimeStoragePort({
      browserStorage: sys.localStorage,
    });
    this.storagePort = storage.port;
    console.info(`[FindscapeStorage] Using ${storage.platform} storage`);
    const saveData = await loadLocalSaveFromStorage(this.storagePort);
    this.sessionContext = createDemoSessionContext(config);
    this.sessionState = returnToModeSelect(
      createInitialDemoSessionState(saveData),
    );

    await this.initializeSceneEntities(config);
    this.configureRoundTargets();
    for (const targetNode of this.targetNodesById.values()) {
      targetNode.on(Node.EventType.TOUCH_END, this.handleTargetTouch, this);
    }

    this.mapWorld.on(Node.EventType.TOUCH_START, this.handleMapTouchStart, this);
    this.mapWorld.on(Node.EventType.TOUCH_MOVE, this.handleMapTouchMove, this);
    this.mapWorld.on(Node.EventType.TOUCH_END, this.handleMapTouch, this);
    this.mapWorld.on(Node.EventType.TOUCH_CANCEL, this.handleMapTouchCancel, this);
    this.hud.getHintButton()?.on(
      Node.EventType.TOUCH_END,
      this.handleHintTouch,
      this,
    );
    this.hud.getMagnifierButton()?.on(
      Node.EventType.TOUCH_END,
      this.handleMagnifierTouch,
      this,
    );
    this.hud.getTargetPanelToggle()?.on(
      Node.EventType.TOUCH_END,
      this.handleTargetPanelToggleTouch,
      this,
    );
    this.ready = true;
    this.setToolsVisible(false);
    this.modeSelect.show(
      this.sessionContext.modeSummaries,
      this.sessionState.saveData.bestByModeId,
    );
    this.bindModeButtons();
    this.renderHud();
  }

  private handleTargetTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (this.mapGestureDragged) {
      this.resetMapGesture();
      return;
    }
    this.resetMapGesture();
    if (!this.sessionState || this.sessionState.screen !== "round") {
      return;
    }
    const targetNode = event.currentTarget as Node;
    const targetId = this.sceneEntityBinder?.getTargetIdForNode(targetNode);
    const targetConfig = targetId
      ? this.targetConfigsById.get(targetId)
      : undefined;
    if (!targetConfig) {
      return;
    }

    const update = applyDemoSessionTap(this.sessionState, targetConfig.position, {
      completedAtUnixMs: Date.now(),
    });
    this.applySessionUpdate(update);
    if (update.roundEvents.some((roundEvent) => roundEvent.type === "correctHit")) {
      const foundEntity = this.sceneEntityRegistry?.markTargetFound(
        targetConfig.targetId,
      );
      if (foundEntity) {
        this.entityMotion.stopEntity(foundEntity.entity.entityId);
      }
      this.feedback?.playTarget(targetNode);
    }
    this.renderHud();
  }

  private handleMapTouchStart(): void {
    if (
      !this.sessionState ||
      this.sessionState.screen !== "round" ||
      this.magnifierZoomActive
    ) {
      return;
    }
    this.mapGestureActive = true;
    this.mapGestureDragged = false;
    this.mapGestureDistance = 0;
    this.hud?.setMapInteractionActive(true);
  }

  private handleMapTouchMove(event: EventTouch): void {
    if (!this.mapGestureActive || !this.mapWorld) {
      return;
    }
    const delta = event.getUIDelta();
    this.mapGestureDistance += Math.hypot(delta.x, delta.y);
    if (this.mapGestureDistance < DRAG_THRESHOLD) {
      return;
    }
    this.mapGestureDragged = true;
    const position = this.mapWorld.position;
    const scale = this.mapWorld.scale.x;
    const visibleSize = view.getVisibleSize();
    const maxX = Math.max(0, (MAP_WIDTH * scale - visibleSize.width) / 2);
    const maxY = Math.max(0, (MAP_HEIGHT * scale - visibleSize.height) / 2);
    this.mapWorld.setPosition(
      Math.min(maxX, Math.max(-maxX, position.x + delta.x)),
      Math.min(maxY, Math.max(-maxY, position.y + delta.y)),
      position.z,
    );
  }

  private handleMapTouch(event: EventTouch): void {
    if (this.mapGestureDragged) {
      this.resetMapGesture();
      return;
    }
    this.resetMapGesture();
    if (
      !this.sessionState ||
      this.sessionState.screen !== "round" ||
      !this.mapWorld
    ) {
      return;
    }
    const location = event.getUILocation();
    const mapTransform = this.mapWorld.getComponent(UITransform);
    const feedbackTransform = this.feedback?.node.getComponent(UITransform);
    if (!mapTransform || !feedbackTransform) {
      return;
    }
    const mapLocal = mapTransform.convertToNodeSpaceAR(
      new Vec3(location.x, location.y, 0),
    );
    const update = applyDemoSessionTap(this.sessionState, {
      x: mapLocal.x + 800,
      y: 1200 - mapLocal.y,
    });
    this.applySessionUpdate(update);
    if (update.roundEvents.some((roundEvent) => roundEvent.type === "wrongTap")) {
      const feedbackLocal = feedbackTransform.convertToNodeSpaceAR(
        new Vec3(location.x, location.y, 0),
      );
      this.feedback?.playWrongAt(feedbackLocal);
    }
    this.renderHud();
  }

  private handleMapTouchCancel(): void {
    this.resetMapGesture();
  }

  private handleTargetPanelToggleTouch(event: EventTouch): void {
    event.propagationStopped = true;
    this.hud?.toggleTargetPanel();
  }

  private handleHintTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (!this.sessionState || this.sessionState.screen !== "round") {
      return;
    }
    const update = applyDemoSessionHint(this.sessionState);
    this.applySessionUpdate(update);
    const hintEvent = update.toolEvents.find(
      (toolEvent) => toolEvent.type === "hintReveal",
    );
    if (hintEvent?.type === "hintReveal") {
      const targetNode = this.targetNodesById.get(hintEvent.target.targetId);
      if (targetNode) {
        this.feedback?.playHint(targetNode, hintEvent.durationSeconds);
      }
    }
    this.renderHud();
  }

  private handleMagnifierTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (!this.sessionState || this.sessionState.screen !== "round") {
      return;
    }

    const update = applyDemoSessionMagnifier(this.sessionState);
    this.applySessionUpdate(update);
    const magnifierEvent = update.toolEvents.find(
      (toolEvent) => toolEvent.type === "magnifierZoom",
    );
    if (magnifierEvent?.type === "magnifierZoom") {
      this.playMagnifierZoom(
        magnifierEvent.zoomMultiplier,
        magnifierEvent.durationSeconds,
      );
    }
    this.renderHud();
  }

  private handleRetryTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (
      !this.sessionContext ||
      !this.sessionState ||
      this.sessionState.screen !== "settlement"
    ) {
      return;
    }

    this.sessionState = startDemoRound(
      this.sessionContext,
      this.sessionState,
      this.sessionState.selectedModeId ?? DEFAULT_MODE_ID,
    );
    this.stopMagnifierZoom();
    this.resetMapPosition();
    this.resetTargetVisuals();
    this.renderHud();
  }

  private handleModesTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (
      !this.sessionContext ||
      !this.sessionState ||
      this.sessionState.screen !== "settlement" ||
      !this.modeSelect
    ) {
      return;
    }

    this.sessionState = returnToModeSelect(this.sessionState);
    this.sceneEntityRegistry?.projectMode([]);
    if (this.sceneEntityRegistry) {
      this.sceneEntityBinder?.apply(this.sceneEntityRegistry);
    }
    this.refreshEntityMotions();
    this.settlement?.hide();
    this.modeSelect.show(
      this.sessionContext.modeSummaries,
      this.sessionState.saveData.bestByModeId,
    );
    this.bindModeButtons();
  }

  private handleModeTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (
      !this.sessionContext ||
      !this.sessionState ||
      this.sessionState.screen !== "modeSelect"
    ) {
      return;
    }

    const modeId = (event.currentTarget as Node).name.replace("ModeButton_", "");
    this.sessionState = startDemoRound(
      this.sessionContext,
      this.sessionState,
      modeId,
    );
    this.stopMagnifierZoom();
    this.resetMapPosition();
    this.configureRoundTargets();
    this.modeSelect?.hide();
    this.renderHud();
  }

  private renderHud(): void {
    if (this.sessionState?.roundViewModel) {
      const viewModel = this.sessionState.roundViewModel;
      this.hud?.render(viewModel.hud);
      this.setToolsVisible(!viewModel.settlement);
      if (viewModel.settlement) {
        const modeId = this.sessionState.selectedModeId;
        const best = modeId
          ? this.sessionState.saveData.bestByModeId[modeId]
          : undefined;
        const isNewBest = Boolean(
          best &&
          this.sessionState.lastResult?.modeId === modeId &&
          best.updatedAtUnixMs === this.sessionState.lastResult.completedAtUnixMs,
        );
        this.settlement?.show(
          viewModel.settlement,
          best?.bestScore,
          isNewBest,
        );
      } else {
        this.settlement?.hide();
      }
    }
  }

  private createSettlement(): PortraitSettlement {
    const root = new Node("SettlementRoot");
    root.active = false;
    this.node.addChild(root);
    root.setSiblingIndex(this.node.children.length - 1);
    return root.addComponent(PortraitSettlement);
  }

  private createModeSelect(): PortraitModeSelect {
    const root = new Node("ModeSelectRoot");
    root.active = false;
    this.node.addChild(root);
    root.setSiblingIndex(this.node.children.length - 1);
    return root.addComponent(PortraitModeSelect);
  }

  private showLoadState(state: "loading" | "error"): void {
    this.hideLoadState();
    const root = new Node("LoadStateRoot");
    root.layer = this.node.layer;
    root.addComponent(UITransform).setContentSize(1080, 1920);
    root.addComponent(BlockInputEvents);
    const backdrop = root.addComponent(Graphics);
    backdrop.fillColor = new Color(38, 48, 43, 185);
    backdrop.rect(-540, -960, 1080, 1920);
    backdrop.fill();

    const panel = new Node("LoadStatePanel");
    panel.layer = this.node.layer;
    panel.addComponent(UITransform).setContentSize(760, 260);
    root.addChild(panel);
    const panelGraphics = panel.addComponent(Graphics);
    panelGraphics.lineWidth = 6;
    panelGraphics.fillColor = new Color(253, 246, 230, 255);
    panelGraphics.strokeColor =
      state === "error"
        ? new Color(240, 138, 122, 255)
        : new Color(107, 87, 68, 255);
    panelGraphics.roundRect(-380, -130, 760, 260, 36);
    panelGraphics.fill();
    panelGraphics.stroke();

    const labelNode = new Node("LoadStateLabel");
    labelNode.layer = this.node.layer;
    labelNode.addComponent(UITransform).setContentSize(680, 100);
    panel.addChild(labelNode);
    const label = labelNode.addComponent(Label);
    label.string = state === "error" ? "UNABLE TO START" : "LOADING";
    label.fontSize = 54;
    label.lineHeight = 64;
    label.color =
      state === "error"
        ? new Color(192, 82, 107, 255)
        : new Color(107, 87, 68, 255);
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;

    this.node.addChild(root);
    root.setSiblingIndex(this.node.children.length - 1);
    this.loadStateRoot = root;
  }

  private hideLoadState(): void {
    if (this.loadStateRoot?.isValid) {
      this.loadStateRoot.destroy();
    }
    this.loadStateRoot = null;
  }

  private setToolsVisible(visible: boolean): void {
    const hintButton = this.hud?.getHintButton();
    const magnifierButton = this.hud?.getMagnifierButton();
    const toolIds = new Set(
      this.sessionState?.roundContext?.modeRuntimeConfig.tools.map(
        (tool) => tool.toolId,
      ) ?? [],
    );
    if (hintButton) {
      hintButton.active = visible && toolIds.has("hint");
    }
    if (magnifierButton) {
      magnifierButton.active = visible && toolIds.has("magnifier");
    }
  }

  private bindModeButtons(): void {
    if (this.modeButtonsBound || !this.modeSelect) {
      return;
    }
    this.modeButtonsBound = true;
    for (const button of this.modeSelect.getModeButtons().values()) {
      button.on(Node.EventType.TOUCH_END, this.handleModeTouch, this);
    }
  }

  private configureRoundTargets(): void {
    this.targetConfigsById.clear();
    for (const target of this.sessionState?.roundContext?.modeRuntimeConfig
      .selectedTargets ?? []) {
      this.targetConfigsById.set(target.targetId, target);
    }
    this.sceneEntityRegistry?.projectMode(
      this.sessionState?.roundContext?.modeRuntimeConfig.selectedTargets ?? [],
    );
    this.resetTargetVisuals();
  }

  private resetTargetVisuals(): void {
    this.sceneEntityRegistry?.resetRound();
    if (this.sceneEntityRegistry) {
      this.sceneEntityBinder?.apply(this.sceneEntityRegistry);
    }
    for (const [targetId, targetNode] of this.targetNodesById) {
      Tween.stopAllByTarget(targetNode);
      const opacity = targetNode.getComponent(UIOpacity);
      if (opacity) {
        Tween.stopAllByTarget(opacity);
      }
      targetNode.active =
        this.sceneEntityRegistry?.getByTargetId(targetId)?.active ??
        this.targetConfigsById.has(targetId);
      const configuredScale = this.sceneEntityRegistry
        ?.getByTargetId(targetId)
        ?.entity.transform.scale ?? { x: 1, y: 1 };
      targetNode.setScale(configuredScale.x, configuredScale.y, 1);
      if (opacity) {
        opacity.opacity = 255;
      }
    }
    this.refreshEntityMotions();
  }

  private refreshEntityMotions(): void {
    if (
      !this.sceneEntityRegistry ||
      !this.sceneEntityBinder ||
      !this.sessionContext
    ) {
      this.entityMotion.stopAll();
      return;
    }
    const schedule = createEntityMotionSchedule(
      this.sceneEntityRegistry.getAll(),
      this.sessionContext.config.motionProfiles ?? [],
    );
    this.entityMotion.play(schedule, this.sceneEntityBinder);
  }

  private async initializeSceneEntities(config: GameplayConfig): Promise<void> {
    if (!this.mapWorld || !this.sessionContext) {
      return;
    }
    const map = this.getInitialMap(config);
    const targetPointSet = this.sessionContext.index.targetPointSetsById.get(
      map.targetPointSetId,
    );
    if (!targetPointSet) {
      throw new Error(`Unknown target point set: ${map.targetPointSetId}`);
    }
    const sceneEntitySet = config.sceneEntitySets?.find(
      (entitySet) => entitySet.sceneEntitySetId === map.sceneEntitySetId,
    );
    this.sceneEntityRegistry = new SceneEntityRegistry({
      map,
      targetPointSet,
      targetTypesById: this.sessionContext.targetTypesById,
      sceneEntitySet,
    });
    this.sceneEntityRegistry.projectMode([]);
    this.sceneEntityBinder = new PortraitSceneEntityBinder(this.mapWorld);
    await this.sceneEntityBinder.initialize(this.sceneEntityRegistry, map);
    this.targetNodesById = this.sceneEntityBinder.getTargetNodes();
  }

  private getInitialMap(config: GameplayConfig): MapConfig {
    const firstMode = config.gameModes[0];
    const map = firstMode
      ? this.sessionContext?.index.mapsById.get(firstMode.mapId)
      : config.maps[0];
    if (!map) {
      throw new Error("At least one gameplay map is required");
    }
    return map;
  }

  private playMagnifierZoom(
    zoomMultiplier: number,
    durationSeconds: number,
  ): void {
    if (!this.mapWorld) {
      return;
    }

    this.stopMagnifierZoom();
    this.magnifierZoomActive = true;
    tween(this.mapWorld)
      .to(
        0.25,
        { scale: new Vec3(zoomMultiplier, zoomMultiplier, 1) },
        { easing: "quadOut" },
      )
      .delay(durationSeconds)
      .to(0.25, { scale: new Vec3(1, 1, 1) }, { easing: "quadInOut" })
      .call(() => {
        this.magnifierZoomActive = false;
      })
      .start();
  }

  private stopMagnifierZoom(): void {
    if (!this.mapWorld) {
      return;
    }
    Tween.stopAllByTarget(this.mapWorld);
    this.mapWorld.setScale(1, 1, 1);
    this.magnifierZoomActive = false;
  }

  private resetMapGesture(): void {
    this.mapGestureActive = false;
    this.mapGestureDragged = false;
    this.mapGestureDistance = 0;
    this.hud?.setMapInteractionActive(false);
  }

  private resetMapPosition(): void {
    this.resetMapGesture();
    this.mapWorld?.setPosition(0, 0, 0);
  }

  private applySessionUpdate(update: DemoSessionUpdate): void {
    const reachedSettlement =
      this.sessionState?.screen === "round" &&
      update.state.screen === "settlement";
    this.audioFeedback?.playPlans(update.feedbackPlans);
    this.sessionState = update.state;
    if (reachedSettlement) {
      this.stopMagnifierZoom();
      this.entityMotion.stopAll();
    }
    if (reachedSettlement && this.storagePort) {
      void saveLocalSaveToStorage(
        this.storagePort,
        update.state.saveData,
      ).catch(() => undefined);
    }
  }

  private loadGameplayConfig(): Promise<GameplayConfig> {
    return new Promise((resolve, reject) => {
      resources.load("config/demo-gameplay", JsonAsset, (error, asset) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(asset.json as GameplayConfig);
      });
    });
  }
}
