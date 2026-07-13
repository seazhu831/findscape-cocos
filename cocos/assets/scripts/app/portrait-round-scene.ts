import {
  _decorator,
  Component,
  EventTouch,
  JsonAsset,
  Node,
  resources,
  UIOpacity,
  UITransform,
  Vec3,
} from "cc";
import {
  applyDemoSessionHint,
  applyDemoSessionTap,
  applyDemoSessionTick,
  createDemoSessionContext,
  createInitialDemoSessionState,
  startDemoRound,
  type DemoSessionContext,
  type DemoSessionState,
} from "./demo-session";
import type {
  GameplayConfig,
  TargetPointConfig,
} from "../config/gameplay-schema";
import { PortraitFeedback } from "../feedback/portrait-feedback";
import { PortraitHud } from "../ui/portrait-hud";
import { PortraitSettlement } from "../ui/portrait-settlement";

const { ccclass } = _decorator;
const DEFAULT_MODE_ID = "hidden_object_demo";

@ccclass("PortraitRoundScene")
export class PortraitRoundScene extends Component {
  private sessionContext: DemoSessionContext | null = null;
  private sessionState: DemoSessionState | null = null;
  private mapWorld: Node | null = null;
  private feedback: PortraitFeedback | null = null;
  private hud: PortraitHud | null = null;
  private settlement: PortraitSettlement | null = null;
  private targetNodesById = new Map<string, Node>();
  private targetConfigsById = new Map<string, TargetPointConfig>();
  private ready = false;

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
    this.sessionState = update.state;
    this.renderHud();
  }

  protected onDestroy(): void {
    this.mapWorld?.off(Node.EventType.TOUCH_END, this.handleMapTouch, this);
    for (const target of this.targetNodesById.values()) {
      target.off(Node.EventType.TOUCH_END, this.handleTargetTouch, this);
    }
    this.hud?.getHintButton()?.off(
      Node.EventType.TOUCH_END,
      this.handleHintTouch,
      this,
    );
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

    const config = await this.loadGameplayConfig();
    this.sessionContext = createDemoSessionContext(config);
    this.sessionState = startDemoRound(
      this.sessionContext,
      createInitialDemoSessionState(),
      DEFAULT_MODE_ID,
    );

    for (const child of this.mapWorld.children) {
      if (child.name.startsWith("demo_")) {
        this.targetNodesById.set(child.name, child);
      }
    }
    for (const target of this.sessionState.roundContext?.modeRuntimeConfig
      .selectedTargets ?? []) {
      this.targetConfigsById.set(target.targetId, target);
    }

    const selectedIds = new Set(this.targetConfigsById.keys());
    for (const [targetId, targetNode] of this.targetNodesById) {
      targetNode.active = selectedIds.has(targetId);
      targetNode.setScale(1, 1, 1);
      const opacity = targetNode.getComponent(UIOpacity);
      if (opacity) {
        opacity.opacity = 255;
      }
      if (targetNode.active) {
        targetNode.on(Node.EventType.TOUCH_END, this.handleTargetTouch, this);
      }
    }

    this.mapWorld.on(Node.EventType.TOUCH_END, this.handleMapTouch, this);
    this.hud.getHintButton()?.on(
      Node.EventType.TOUCH_END,
      this.handleHintTouch,
      this,
    );
    this.ready = true;
    this.renderHud();
  }

  private handleTargetTouch(event: EventTouch): void {
    event.propagationStopped = true;
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
    this.sessionState = update.state;
    if (update.roundEvents.some((roundEvent) => roundEvent.type === "correctHit")) {
      this.feedback?.playTarget(targetNode);
    }
    this.renderHud();
  }

  private handleMapTouch(event: EventTouch): void {
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
    this.sessionState = update.state;
    if (update.roundEvents.some((roundEvent) => roundEvent.type === "wrongTap")) {
      const feedbackLocal = feedbackTransform.convertToNodeSpaceAR(
        new Vec3(location.x, location.y, 0),
      );
      this.feedback?.playWrongAt(feedbackLocal);
    }
    this.renderHud();
  }

  private handleHintTouch(event: EventTouch): void {
    event.propagationStopped = true;
    if (!this.sessionState || this.sessionState.screen !== "round") {
      return;
    }
    const update = applyDemoSessionHint(this.sessionState);
    this.sessionState = update.state;
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

  private renderHud(): void {
    if (this.sessionState?.roundViewModel) {
      const viewModel = this.sessionState.roundViewModel;
      this.hud?.render(viewModel.hud);
      this.setToolsVisible(!viewModel.settlement);
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

  private setToolsVisible(visible: boolean): void {
    const hintButton = this.hud?.getHintButton();
    const magnifierButton = this.hud?.getMagnifierButton();
    if (hintButton) {
      hintButton.active = visible;
    }
    if (magnifierButton) {
      magnifierButton.active = visible;
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
