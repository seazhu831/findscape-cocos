import { Node, tween, Tween, Vec3 } from "cc";
import type { TweenMotionVariantConfig } from "../config/gameplay-schema";
import type { EntityMotionPlan } from "./entity-motion-scheduler";
import type { PortraitSceneEntityBinder } from "./portrait-scene-entity-binder";

export class PortraitEntityMotion {
  private readonly activeVisualsByEntityId = new Map<string, Node>();

  public play(
    plans: EntityMotionPlan[],
    binder: PortraitSceneEntityBinder,
  ): void {
    this.stopAll();
    for (const plan of plans) {
      if (plan.variant.driver !== "tween") {
        continue;
      }
      const visual = binder.getVisualNodeByEntityId(plan.entityId);
      if (!visual) {
        continue;
      }
      this.activeVisualsByEntityId.set(plan.entityId, visual);
      this.playTween(visual, plan, plan.variant);
    }
  }

  public stopEntity(entityId: string): void {
    const visual = this.activeVisualsByEntityId.get(entityId);
    if (!visual) {
      return;
    }
    resetVisual(visual);
    this.activeVisualsByEntityId.delete(entityId);
  }

  public stopAll(): void {
    for (const visual of this.activeVisualsByEntityId.values()) {
      resetVisual(visual);
    }
    this.activeVisualsByEntityId.clear();
  }

  private playTween(
    visual: Node,
    plan: EntityMotionPlan,
    variant: TweenMotionVariantConfig,
  ): void {
    resetVisual(visual);
    const durationSeconds = variant.durationMs / 1000 / plan.playbackRate;
    const offset = variant.offset ?? { x: 0, y: 0 };
    const scale = variant.scaleMultiplier ?? { x: 1, y: 1 };
    const animated = {
      position: new Vec3(offset.x, -offset.y, 0),
      angle: -(variant.rotationDegrees ?? 0),
      scale: new Vec3(scale.x, scale.y, 1),
    };
    const resting = {
      position: Vec3.ZERO.clone(),
      angle: 0,
      scale: Vec3.ONE.clone(),
    };
    const easing = variant.easing ?? "sineInOut";
    let cycle = tween<Node>().to(durationSeconds, animated, { easing });
    if (variant.yoyo) {
      cycle = cycle.to(durationSeconds, resting, { easing });
    } else if (variant.loop) {
      cycle = cycle.to(0, resting);
    }
    const sequence = tween(visual).delay(plan.startDelayMs / 1000);
    if (variant.loop) {
      sequence.repeatForever(cycle);
    } else {
      sequence.then(cycle);
    }
    sequence.start();
  }
}

function resetVisual(visual: Node): void {
  Tween.stopAllByTarget(visual);
  visual.setPosition(0, 0, 0);
  visual.setScale(1, 1, 1);
  visual.angle = 0;
}
