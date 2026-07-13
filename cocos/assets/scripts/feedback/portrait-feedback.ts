import {
  _decorator,
  Color,
  Component,
  Graphics,
  Layers,
  Node,
  tween,
  UIOpacity,
  UITransform,
  Vec3,
} from "cc";

const { ccclass } = _decorator;
const DONT_SAVE_OBJECT_FLAG = 8;

const COLORS = {
  outline: new Color(107, 87, 68, 255),
  yellow: new Color(242, 201, 76, 255),
  coral: new Color(240, 138, 122, 255),
  berry: new Color(192, 82, 107, 255),
  sky: new Color(143, 193, 227, 255),
};

@ccclass("PortraitFeedback")
export class PortraitFeedback extends Component {
  public playTarget(target: Node): void {
    if (target.name.includes("balloon")) {
      this.playBalloonPop(target);
      return;
    }
    if (target.name.includes("thief")) {
      this.playCatchPulse(target);
      return;
    }
    this.playFindSuccess(target);
  }

  public playWrongAt(localPosition: Vec3): void {
    const ripple = this.createEffectNode("WrongTapRipple", localPosition, 180, 180);
    const graphics = ripple.addComponent(Graphics);
    graphics.lineWidth = 8;
    graphics.strokeColor = COLORS.coral;
    graphics.circle(0, 0, 54);
    graphics.stroke();
    ripple.setScale(0.35, 0.35, 1);
    const opacity = ripple.addComponent(UIOpacity);

    tween(ripple)
      .to(0.3, { scale: new Vec3(1.15, 1.15, 1) }, { easing: "sineOut" })
      .call(() => ripple.destroy())
      .start();
    tween(opacity).to(0.3, { opacity: 0 }).start();
  }

  public playHint(target: Node, durationSeconds = 2): void {
    const effect = this.createEffectNode(
      "HintReveal",
      target.position.clone(),
      280,
      280,
    );
    const graphics = effect.addComponent(Graphics);
    graphics.lineWidth = 12;
    graphics.strokeColor = COLORS.yellow;
    graphics.circle(0, 0, 92);
    graphics.stroke();
    effect.setScale(0.6, 0.6, 1);
    const opacity = effect.addComponent(UIOpacity);
    tween(effect)
      .to(
        durationSeconds,
        { scale: new Vec3(1.6, 1.6, 1) },
        { easing: "sineOut" },
      )
      .call(() => effect.destroy())
      .start();
    tween(opacity)
      .delay(durationSeconds * 0.55)
      .to(durationSeconds * 0.45, { opacity: 0 })
      .start();
  }

  private playFindSuccess(target: Node): void {
    const effect = this.createEffectNode(
      "FindSuccess",
      target.position.clone(),
      240,
      240,
    );
    const graphics = effect.addComponent(Graphics);
    graphics.lineWidth = 10;
    graphics.strokeColor = COLORS.yellow;
    graphics.circle(0, 0, 84);
    graphics.stroke();
    this.drawSparkles(graphics, COLORS.yellow);
    this.animateEffect(effect, 0.7, 0.55, 1.35);
    this.animateTargetOut(target, 0.7, 1.16);
  }

  private playBalloonPop(target: Node): void {
    const effect = this.createEffectNode(
      "BalloonPop",
      target.position.clone(),
      240,
      240,
    );
    const graphics = effect.addComponent(Graphics);
    graphics.fillColor = new Color(240, 138, 122, 150);
    for (const [x, y, radius] of [
      [0, 0, 42],
      [-54, 10, 24],
      [50, 18, 28],
      [-28, -45, 20],
      [34, -42, 22],
    ]) {
      graphics.circle(x, y, radius);
      graphics.fill();
    }
    this.animateEffect(effect, 0.5, 0.45, 1.45);
    this.animateTargetOut(target, 0.5, 1.3);
  }

  private playCatchPulse(target: Node): void {
    const effect = this.createEffectNode(
      "CatchPulse",
      target.position.clone(),
      260,
      260,
    );
    const graphics = effect.addComponent(Graphics);
    graphics.lineWidth = 10;
    graphics.strokeColor = COLORS.berry;
    graphics.roundRect(-92, -92, 184, 184, 42);
    graphics.stroke();
    this.drawSparkles(graphics, COLORS.sky);
    this.animateEffect(effect, 0.8, 0.65, 1.25);
    this.animateTargetOut(target, 0.8, 1.12);
  }

  private animateEffect(
    effect: Node,
    duration: number,
    initialScale: number,
    finalScale: number,
  ): void {
    effect.setScale(initialScale, initialScale, 1);
    const opacity = effect.addComponent(UIOpacity);
    tween(effect)
      .to(duration, { scale: new Vec3(finalScale, finalScale, 1) }, { easing: "sineOut" })
      .call(() => effect.destroy())
      .start();
    tween(opacity)
      .delay(duration * 0.35)
      .to(duration * 0.65, { opacity: 0 })
      .start();
  }

  private animateTargetOut(target: Node, duration: number, peakScale: number): void {
    const opacity = target.getComponent(UIOpacity) ?? target.addComponent(UIOpacity);
    const growDuration = duration * 0.25;
    const fadeDuration = duration - growDuration;
    tween(target)
      .to(growDuration, { scale: new Vec3(peakScale, peakScale, 1) }, { easing: "sineOut" })
      .to(fadeDuration, { scale: new Vec3(0.2, 0.2, 1) }, { easing: "sineIn" })
      .call(() => {
        target.active = false;
      })
      .start();
    tween(opacity).delay(growDuration).to(fadeDuration, { opacity: 0 }).start();
  }

  private createEffectNode(
    name: string,
    position: Vec3,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    node._objFlags |= DONT_SAVE_OBJECT_FLAG;
    node.layer = Layers.Enum.UI_2D;
    this.node.addChild(node);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  private drawSparkles(graphics: Graphics, color: Color): void {
    graphics.fillColor = color;
    for (const [x, y, radius] of [
      [-96, 74, 10],
      [102, 42, 8],
      [-72, -88, 7],
      [82, -78, 9],
    ]) {
      graphics.circle(x, y, radius);
      graphics.fill();
    }
  }
}
