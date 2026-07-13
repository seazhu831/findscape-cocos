import {
  _decorator,
  Component,
  EventTouch,
  JsonAsset,
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
  TargetPointConfig,
} from "../config/gameplay-schema";
import { PortraitFeedback } from "../feedback/portrait-feedback";
import { PortraitHud } from "../ui/portrait-hud";
import { PortraitModeSelect } from "../ui/portrait-mode-select";
import { PortraitSettlement } from "../ui/portrait-settlement";
import { createBrowserStoragePort } from "../platform/browser-storage";
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
  private hud: PortraitHud | null = null;
  private settlement: PortraitSettlement | null = null;
  private modeSelect: PortraitModeSelect | null = null;
  private storagePort: KeyValueStoragePort | null = null;
  private targetNodesById = new Map<string, Node>();
  private targetConfigsById = new Map<string, TargetPointConfig>();
  private ready = false;
  private modeButtonsBound = false;
  private mapGestureActive = false;
  private mapGestureDragged = false;
  private mapGestureDistance = 0;
  private magnifierZoomActive = false;

  protected start(): void {
    void this.initialize().catch((error) => {
      console.error("[PortraitRoundScene] Initialization failed", error);
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
    this.stopMagnifierZoom();
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
    this.storagePort = createBrowserStoragePort(sys.localStorage);
    const saveData = await loadLocalSaveFromStorage(this.storagePort);
    this.sessionContext = createDemoSessionContext(config);
    this.sessionState = startDemoRound(
      this.sessionContext,
      createInitialDemoSessionState(saveData),
      DEFAULT_MODE_ID,
    );

    for (const child of this.mapWorld.children) {
      if (child.name.startsWith("demo_")) {
        this.targetNodesById.set(child.name, child);
      }
    }
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
    this.ready = true;
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
    const targetConfig = this.targetConfigsById.get(targetNode.name);
    if (!targetConfig) {
      return;
    }

    const update = applyDemoSessionTap(this.sessionState, targetConfig.position, {
      completedAtUnixMs: Date.now(),
    });
    this.applySessionUpdate(update);
    if (update.roundEvents.some((roundEvent) => roundEvent.type === "correctHit")) {
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
    this.settlement?.hide();
    this.modeSelect.show(this.sessionContext.modeSummaries);
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
      this.renderMagnifierState();
      if (viewModel.settlement) {
        this.settlement?.show(viewModel.settlement);
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
    this.resetTargetVisuals();
  }

  private resetTargetVisuals(): void {
    const selectedIds = new Set(this.targetConfigsById.keys());
    for (const [targetId, targetNode] of this.targetNodesById) {
      targetNode.active = selectedIds.has(targetId);
      targetNode.setScale(1, 1, 1);
      const opacity = targetNode.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 255;
      }
    }
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
  }

  private resetMapPosition(): void {
    this.resetMapGesture();
    this.mapWorld?.setPosition(0, 0, 0);
  }

  private renderMagnifierState(): void {
    const magnifierButton = this.hud?.getMagnifierButton();
    if (!magnifierButton) {
      return;
    }
    const opacity =
      magnifierButton.getComponent(UIOpacity) ??
      magnifierButton.addComponent(UIOpacity);
    const magnifierState =
      this.sessionState?.roundState?.tools.toolsById.magnifier;
    opacity.opacity =
      magnifierState && magnifierState.usesRemaining <= 0 ? 110 : 255;
  }

  private applySessionUpdate(update: DemoSessionUpdate): void {
    const reachedSettlement =
      this.sessionState?.screen === "round" &&
      update.state.screen === "settlement";
    this.sessionState = update.state;
    if (reachedSettlement) {
      this.stopMagnifierZoom();
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
