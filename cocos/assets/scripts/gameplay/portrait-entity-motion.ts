import {
  Animation,
  AnimationClip,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
  Vec3,
} from "cc";
import type {
  AnimationClipMotionVariantConfig,
  SpriteFramesMotionVariantConfig,
  TweenMotionVariantConfig,
} from "../config/gameplay-schema";
import type { EntityMotionPlan } from "./entity-motion-scheduler";
import type { PortraitSceneEntityBinder } from "./portrait-scene-entity-binder";

export class PortraitEntityMotion {
  private readonly activeVisualsByEntityId = new Map<string, Node>();
  private readonly restingFramesByEntityId = new Map<
    string,
    SpriteFrame | null
  >();
  private readonly activeClipsByEntityId = new Map<string, AnimationClip>();
  private readonly versionsByEntityId = new Map<string, number>();
  private generation = 0;

  public play(
    plans: EntityMotionPlan[],
    binder: PortraitSceneEntityBinder,
  ): void {
    this.stopAll();
    const generation = this.generation;
    for (const plan of plans) {
      const visual = binder.getVisualNodeByEntityId(plan.entityId);
      if (!visual) {
        continue;
      }
      const version = this.nextEntityVersion(plan.entityId);
      this.activeVisualsByEntityId.set(plan.entityId, visual);
      this.restingFramesByEntityId.set(
        plan.entityId,
        visual.getComponent(Sprite)?.spriteFrame ?? null,
      );
      if (plan.variant.driver === "tween") {
        this.playTween(visual, plan, plan.variant);
      } else if (plan.variant.driver === "spriteFrames") {
        void this.playSpriteFrames(
          visual,
          plan,
          plan.variant,
          generation,
          version,
        ).catch((error) => {
          console.warn(`[EntityMotion] Unable to load ${plan.entityId} frames`, error);
        });
      } else {
        void this.playAnimationClip(
          visual,
          plan,
          plan.variant,
          generation,
          version,
        ).catch((error) => {
          console.warn(`[EntityMotion] Unable to load ${plan.entityId} clip`, error);
        });
      }
    }
  }

  public stopEntity(entityId: string): void {
    const visual = this.activeVisualsByEntityId.get(entityId);
    if (!visual) {
      return;
    }
    this.nextEntityVersion(entityId);
    this.resetEntityVisual(entityId, visual);
    this.activeVisualsByEntityId.delete(entityId);
    this.restingFramesByEntityId.delete(entityId);
  }

  public stopAll(): void {
    this.generation += 1;
    for (const [entityId, visual] of this.activeVisualsByEntityId) {
      this.nextEntityVersion(entityId);
      this.resetEntityVisual(entityId, visual);
    }
    this.activeVisualsByEntityId.clear();
    this.restingFramesByEntityId.clear();
    this.activeClipsByEntityId.clear();
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

  private async playSpriteFrames(
    visual: Node,
    plan: EntityMotionPlan,
    variant: SpriteFramesMotionVariantConfig,
    generation: number,
    version: number,
  ): Promise<void> {
    const frames = await loadSpriteFrames(variant.frameAssets);
    if (!this.isCurrent(plan.entityId, generation, version)) {
      return;
    }
    const sprite = visual.getComponent(Sprite);
    if (!sprite) {
      return;
    }
    const frameDuration = 1 / variant.framesPerSecond / plan.playbackRate;
    let cycle = tween<Node>();
    for (const frame of frames) {
      cycle = cycle.call(() => {
        sprite.spriteFrame = frame;
      }).delay(frameDuration);
    }
    const sequence = tween(visual).delay(plan.startDelayMs / 1000);
    if (variant.loop) {
      sequence.repeatForever(cycle);
    } else {
      sequence.then(cycle);
    }
    sequence.start();
  }

  private async playAnimationClip(
    visual: Node,
    plan: EntityMotionPlan,
    variant: AnimationClipMotionVariantConfig,
    generation: number,
    version: number,
  ): Promise<void> {
    const clip = variant.clipAsset
      ? await loadAnimationClip(variant.clipAsset)
      : AnimationClip.createWithSpriteFrames(
          await loadSpriteFrames(variant.frameAssets),
          variant.framesPerSecond,
        );
    if (!this.isCurrent(plan.entityId, generation, version)) {
      return;
    }
    const animation =
      visual.getComponent(Animation) ?? visual.addComponent(Animation);
    const stateName = `EntityMotion_${plan.entityId}`;
    const state = animation.addClip(clip, stateName);
    state.speed = variant.speed * plan.playbackRate;
    state.wrapMode = variant.loop
      ? AnimationClip.WrapMode.Loop
      : AnimationClip.WrapMode.Normal;
    this.activeClipsByEntityId.set(plan.entityId, clip);
    tween(visual)
      .delay(plan.startDelayMs / 1000)
      .call(() => {
        if (this.isCurrent(plan.entityId, generation, version)) {
          animation.play(stateName);
        }
      })
      .start();
  }

  private resetEntityVisual(entityId: string, visual: Node): void {
    resetVisual(visual);
    const animation = visual.getComponent(Animation);
    const clip = this.activeClipsByEntityId.get(entityId);
    animation?.stop();
    if (animation && clip) {
      animation.removeClip(clip, true);
    }
    const sprite = visual.getComponent(Sprite);
    if (sprite) {
      sprite.spriteFrame = this.restingFramesByEntityId.get(entityId) ?? null;
    }
    this.activeClipsByEntityId.delete(entityId);
  }

  private nextEntityVersion(entityId: string): number {
    const version = (this.versionsByEntityId.get(entityId) ?? 0) + 1;
    this.versionsByEntityId.set(entityId, version);
    return version;
  }

  private isCurrent(
    entityId: string,
    generation: number,
    version: number,
  ): boolean {
    return (
      this.generation === generation &&
      this.versionsByEntityId.get(entityId) === version &&
      this.activeVisualsByEntityId.has(entityId)
    );
  }
}

function resetVisual(visual: Node): void {
  Tween.stopAllByTarget(visual);
  visual.setPosition(0, 0, 0);
  visual.setScale(1, 1, 1);
  visual.angle = 0;
}

function loadSpriteFrames(assetPaths: string[]): Promise<SpriteFrame[]> {
  return Promise.all(
    assetPaths.map(
      (assetPath) =>
        new Promise<SpriteFrame>((resolve, reject) => {
          resources.load(
            `${assetPath}/spriteFrame`,
            SpriteFrame,
            (error, asset) => {
              if (error) {
                reject(error);
                return;
              }
              resolve(asset);
            },
          );
        }),
    ),
  );
}

function loadAnimationClip(assetPath: string): Promise<AnimationClip> {
  return new Promise((resolve, reject) => {
    resources.load(assetPath, AnimationClip, (error, asset) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(asset);
    });
  });
}
