import {
  Layers,
  Node,
  Sprite,
  Tween,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from "cc";
import type { TargetPresentationPlan } from "../gameplay/target-presentation";
import type { PortraitHud } from "../ui/portrait-hud";

const DONT_SAVE_OBJECT_FLAG = 8;
const DEFAULT_ROOT_WIDTH = 1080;
const DEFAULT_ROOT_HEIGHT = 1920;

interface ActiveProxy {
  node: Node;
  generation: number;
}

export class PortraitTargetPresentation {
  private readonly root: Node;
  private readonly activeByToken = new Map<number, ActiveProxy>();
  private generation = 0;

  constructor(
    sceneRoot: Node,
    private readonly hud: PortraitHud,
  ) {
    this.root = new Node("TargetPresentationRoot");
    this.root._objFlags |= DONT_SAVE_OBJECT_FLAG;
    this.root.layer = Layers.Enum.UI_2D;
    const sceneSize = sceneRoot.getComponent(UITransform)?.contentSize;
    this.root.addComponent(UITransform).setContentSize(
      sceneSize?.width ?? DEFAULT_ROOT_WIDTH,
      sceneSize?.height ?? DEFAULT_ROOT_HEIGHT,
    );
    sceneRoot.addChild(this.root);
    this.root.setSiblingIndex(sceneRoot.children.length - 1);
  }

  public play(
    targetNode: Node,
    targetVisual: Node,
    plan: TargetPresentationPlan,
    onComplete: () => void,
  ): boolean {
    const sourceSprite = targetVisual.getComponent(Sprite);
    const destinationNode = this.hud.getTargetArrivalNode(plan.typeId);
    const rootTransform = this.root.getComponent(UITransform);
    if (!sourceSprite?.spriteFrame || !destinationNode || !rootTransform) {
      return false;
    }

    const proxy = this.createProxy(targetVisual, sourceSprite);
    const source = rootTransform.convertToNodeSpaceAR(targetVisual.worldPosition);
    const destination = rootTransform.convertToNodeSpaceAR(
      destinationNode.worldPosition,
    );
    const sourceScale = targetVisual.worldScale;
    proxy.setPosition(source);
    proxy.setScale(sourceScale);
    targetNode.active = false;

    const generation = this.generation;
    this.activeByToken.set(plan.token, { node: proxy, generation });
    const liftPosition = new Vec3(source.x, source.y + 92, source.z);
    const arcPosition = new Vec3(
      (source.x + destination.x) / 2,
      Math.max(source.y, destination.y) + 190,
      source.z,
    );
    const liftedScale = new Vec3(
      sourceScale.x * 1.12,
      sourceScale.y * 1.12,
      1,
    );
    const arrivalScale = new Vec3(0.42, 0.42, 1);
    const liftSeconds = plan.liftDurationMs / 1000;
    const halfFlightSeconds = plan.flightDurationMs / 2000;
    const arrivalSeconds = plan.arrivalDurationMs / 1000;
    const opacity = proxy.addComponent(UIOpacity);

    tween(proxy)
      .to(
        liftSeconds,
        { position: liftPosition, scale: liftedScale, angle: -8 },
        { easing: "sineOut" },
      )
      .to(
        halfFlightSeconds,
        { position: arcPosition, scale: liftedScale, angle: 7 },
        { easing: "quadOut" },
      )
      .to(
        halfFlightSeconds,
        { position: destination, scale: arrivalScale, angle: 0 },
        { easing: "quadIn" },
      )
      .call(() => {
        if (this.isCurrent(plan.token, generation)) {
          this.hud.playTargetArrival(plan.typeId, arrivalSeconds);
        }
      })
      .to(
        arrivalSeconds,
        { scale: new Vec3(0.2, 0.2, 1) },
        { easing: "sineIn" },
      )
      .call(() => this.finish(plan.token, generation, onComplete))
      .start();
    tween(opacity)
      .delay(liftSeconds + plan.flightDurationMs / 1000)
      .to(arrivalSeconds, { opacity: 0 })
      .start();
    return true;
  }

  public cancelAll(): void {
    this.generation += 1;
    for (const active of this.activeByToken.values()) {
      Tween.stopAllByTarget(active.node);
      const opacity = active.node.getComponent(UIOpacity);
      if (opacity) {
        Tween.stopAllByTarget(opacity);
      }
      if (active.node.isValid) {
        active.node.destroy();
      }
    }
    this.activeByToken.clear();
  }

  public dispose(): void {
    this.cancelAll();
    if (this.root.isValid) {
      this.root.destroy();
    }
  }

  private createProxy(targetVisual: Node, sourceSprite: Sprite): Node {
    const proxy = new Node("TargetFlightProxy");
    proxy._objFlags |= DONT_SAVE_OBJECT_FLAG;
    proxy.layer = Layers.Enum.UI_2D;
    const sourceTransform = targetVisual.getComponent(UITransform);
    const size = sourceTransform?.contentSize ?? sourceSprite.spriteFrame.originalSize;
    proxy.addComponent(UITransform).setContentSize(size);
    const sprite = proxy.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = sourceSprite.trim;
    sprite.spriteFrame = sourceSprite.spriteFrame;
    sprite.color = sourceSprite.color.clone();
    this.root.addChild(proxy);
    return proxy;
  }

  private finish(
    token: number,
    generation: number,
    onComplete: () => void,
  ): void {
    if (!this.isCurrent(token, generation)) {
      return;
    }
    const active = this.activeByToken.get(token);
    this.activeByToken.delete(token);
    if (active?.node.isValid) {
      active.node.destroy();
    }
    onComplete();
  }

  private isCurrent(token: number, generation: number): boolean {
    return (
      generation === this.generation &&
      this.activeByToken.get(token)?.generation === generation
    );
  }
}
