import {
  _decorator,
  Color,
  Component,
  Graphics,
  Label,
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  tween,
  Tween,
  UITransform,
  UIOpacity,
  Vec3,
} from "cc";
import { EDITOR } from "cc/env";
import type { RoundHudViewModel } from "./round-view-model";

const { ccclass, executeInEditMode } = _decorator;
const DONT_SAVE_OBJECT_FLAG = 8;

const COLORS = {
  outline: new Color(107, 87, 68, 255),
  panel: new Color(253, 246, 230, 245),
  sky: new Color(143, 193, 227, 255),
  coral: new Color(240, 138, 122, 255),
  yellow: new Color(242, 201, 76, 255),
  berry: new Color(192, 82, 107, 255),
  white: new Color(255, 255, 255, 255),
};

const ICON_SLOTS = [
  { typeId: "pineapple", path: "art/icons/icon_pineapple/spriteFrame", count: 2 },
  { typeId: "balloon", path: "art/icons/icon_balloon/spriteFrame", count: 1 },
  { typeId: "thief", path: "art/icons/icon_thief/spriteFrame", count: 1 },
  { typeId: "puppy", path: "art/icons/icon_puppy/spriteFrame", count: 1 },
  { typeId: "gem", path: "art/icons/icon_gem/spriteFrame", count: 1 },
];

@ccclass("PortraitHud")
@executeInEditMode(true)
export class PortraitHud extends Component {
  private timerLabel: Label | null = null;
  private timerNode: Node | null = null;
  private scoreLabel: Label | null = null;
  private comboLabel: Label | null = null;
  private timerUrgency: RoundHudViewModel["timer"]["urgency"] | null = null;

  protected onLoad(): void {
    this.buildHud();
  }

  protected onDestroy(): void {
    if (this.timerNode) {
      Tween.stopAllByTarget(this.timerNode);
    }
  }

  private buildHud(): void {
    for (const child of [...this.node.children]) {
      child.removeFromParent();
      child.destroy();
    }

    const topBar = this.createRoundedPanel(
      "TopBar",
      980,
      140,
      42,
      new Vec3(0, 800, 0),
    );
    this.buildTopBar(topBar);

    const targetPanel = this.createRoundedPanel(
      "TargetPanel",
      980,
      200,
      46,
      new Vec3(0, -766, 0),
    );
    this.buildTargetList(targetPanel);

    this.buildToolButton(
      "HintButton",
      new Vec3(-400, -540, 0),
      "art/icons/tool_hint/spriteFrame",
    );
    this.buildToolButton(
      "MagnifierButton",
      new Vec3(400, -540, 0),
      "art/icons/tool_magnifier/spriteFrame",
    );
  }

  private buildTopBar(parent: Node): void {
    const clock = this.createGraphicsNode(
      "Clock",
      parent,
      new Vec3(-405, 0, 0),
      76,
      76,
    );
    const clockGraphics = clock.addComponent(Graphics);
    clockGraphics.lineWidth = 6;
    clockGraphics.fillColor = COLORS.sky;
    clockGraphics.strokeColor = COLORS.outline;
    clockGraphics.circle(0, 0, 35);
    clockGraphics.fill();
    clockGraphics.stroke();
    clockGraphics.moveTo(0, 18);
    clockGraphics.lineTo(0, 0);
    clockGraphics.lineTo(16, -9);
    clockGraphics.stroke();

    this.timerNode = this.createLabel(
      "Timer",
      parent,
      "1:00",
      58,
      190,
      80,
      new Vec3(-285, 0, 0),
    );
    this.timerLabel = this.timerNode.getComponent(Label);

    const star = this.createGraphicsNode(
      "ScoreStar",
      parent,
      new Vec3(-82, 0, 0),
      76,
      76,
    );
    this.drawStar(star.addComponent(Graphics), 34, 16);
    this.scoreLabel = this.createLabel(
      "Score",
      parent,
      "0",
      58,
      220,
      80,
      new Vec3(75, 0, 0),
    ).getComponent(Label);

    const combo = this.createRoundedPanel(
      "ComboPill",
      166,
      88,
      44,
      new Vec3(365, 0, 0),
      parent,
      COLORS.coral,
    );
    this.comboLabel = this.createLabel(
      "Combo",
      combo,
      "x0",
      52,
      140,
      76,
      Vec3.ZERO,
      COLORS.white,
    ).getComponent(Label);
  }

  private buildTargetList(parent: Node): void {
    const slotXs = [-380, -190, 0, 190, 380];

    ICON_SLOTS.forEach((slot, index) => {
      const slotNode = this.createNode(
        `TargetSlot_${slot.typeId}`,
        parent,
        new Vec3(slotXs[index], 0, 0),
        150,
        150,
      );
      this.loadSprite(slotNode, slot.path, 118, 118);

      const badge = this.createGraphicsNode(
        "CountBadge",
        slotNode,
        new Vec3(48, 48, 0),
        64,
        64,
      );
      const badgeGraphics = badge.addComponent(Graphics);
      badgeGraphics.lineWidth = 5;
      badgeGraphics.fillColor = COLORS.berry;
      badgeGraphics.strokeColor = COLORS.outline;
      badgeGraphics.circle(0, 0, 30);
      badgeGraphics.fill();
      badgeGraphics.stroke();
      this.createLabel(
        "Count",
        badge,
        String(slot.count),
        38,
        54,
        54,
        Vec3.ZERO,
        COLORS.white,
      );
    });
  }

  public render(viewModel: RoundHudViewModel): void {
    if (this.timerLabel) {
      this.timerLabel.string = viewModel.timer.label;
    }
    this.renderTimerUrgency(
      viewModel.status === "playing" ? viewModel.timer.urgency : "normal",
    );
    if (this.scoreLabel) {
      this.scoreLabel.string = String(viewModel.score);
    }
    if (this.comboLabel) {
      this.comboLabel.string = `x${viewModel.comboStreak}`;
    }
    this.renderToolButton(this.getHintButton(), viewModel, "hint");
    this.renderToolButton(this.getMagnifierButton(), viewModel, "magnifier");

    const targetPanel = this.node.getChildByName("TargetPanel");
    if (!targetPanel) {
      return;
    }
    for (const slotNode of targetPanel.children) {
      slotNode.active = false;
    }

    const spacing = 190;
    const startX = -((viewModel.targetList.length - 1) * spacing) / 2;
    viewModel.targetList.forEach((item, index) => {
      const slotNode = targetPanel.getChildByName(`TargetSlot_${item.typeId}`);
      const countLabel = slotNode
        ?.getChildByName("CountBadge")
        ?.getChildByName("Count")
        ?.getComponent(Label);
      if (!slotNode || !countLabel) {
        return;
      }
      slotNode.active = true;
      slotNode.setPosition(startX + index * spacing, 0, 0);
      countLabel.string = String(
        Math.max(0, item.requiredCount - item.foundCount),
      );
      const opacity =
        slotNode.getComponent(UIOpacity) ?? slotNode.addComponent(UIOpacity);
      opacity.opacity = item.isComplete ? 120 : 255;
    });
  }

  public getHintButton(): Node | null {
    return this.node.getChildByName("HintButton");
  }

  public getMagnifierButton(): Node | null {
    return this.node.getChildByName("MagnifierButton");
  }

  private renderTimerUrgency(
    urgency: RoundHudViewModel["timer"]["urgency"],
  ): void {
    if (!this.timerNode || !this.timerLabel || urgency === this.timerUrgency) {
      return;
    }
    this.timerUrgency = urgency;
    Tween.stopAllByTarget(this.timerNode);
    this.timerNode.setScale(1, 1, 1);
    this.timerLabel.color =
      urgency === "critical"
        ? COLORS.coral
        : urgency === "warning"
          ? COLORS.berry
          : COLORS.outline;
    if (urgency === "critical") {
      tween(this.timerNode)
        .to(0.35, { scale: new Vec3(1.1, 1.1, 1) }, { easing: "sineOut" })
        .to(0.35, { scale: new Vec3(1, 1, 1) }, { easing: "sineIn" })
        .union()
        .repeatForever()
        .start();
    }
  }

  private renderToolButton(
    button: Node | null,
    viewModel: RoundHudViewModel,
    toolId: string,
  ): void {
    if (!button) {
      return;
    }
    const tool = viewModel.tools.find((item) => item.toolId === toolId);
    const usesLabel = button
      .getChildByName("UsesBadge")
      ?.getChildByName("Uses")
      ?.getComponent(Label);
    const cooldownPill = button.getChildByName("CooldownPill");
    const cooldownLabel = cooldownPill
      ?.getChildByName("Cooldown")
      ?.getComponent(Label);
    if (usesLabel) {
      usesLabel.string = String(tool?.usesRemaining ?? 0);
    }
    if (cooldownPill) {
      cooldownPill.active = tool?.isCoolingDown ?? false;
    }
    if (cooldownLabel) {
      cooldownLabel.string = `${tool?.cooldownSeconds ?? 0}s`;
    }
    const opacity = button.getComponent(UIOpacity) ?? button.addComponent(UIOpacity);
    opacity.opacity = tool?.isDepleted ? 110 : tool?.isCoolingDown ? 170 : 255;
  }

  private buildToolButton(name: string, position: Vec3, iconPath: string): void {
    const button = this.createGraphicsNode(name, this.node, position, 180, 180);
    const graphics = button.addComponent(Graphics);
    graphics.lineWidth = 6;
    graphics.fillColor = COLORS.panel;
    graphics.strokeColor = COLORS.outline;
    graphics.circle(0, 0, 82);
    graphics.fill();
    graphics.stroke();
    this.loadSprite(button, iconPath, 122, 122, "Icon");
    const badge = this.createRoundedPanel(
      "UsesBadge",
      62,
      62,
      31,
      new Vec3(56, 56, 0),
      button,
      COLORS.berry,
    );
    this.createLabel("Uses", badge, "0", 34, 52, 52, Vec3.ZERO, COLORS.white);
    const cooldown = this.createRoundedPanel(
      "CooldownPill",
      112,
      52,
      26,
      new Vec3(0, -60, 0),
      button,
      COLORS.outline,
    );
    cooldown.active = false;
    this.createLabel("Cooldown", cooldown, "", 30, 100, 44, Vec3.ZERO, COLORS.white);
  }

  private createRoundedPanel(
    name: string,
    width: number,
    height: number,
    radius: number,
    position: Vec3,
    parent = this.node,
    fillColor = COLORS.panel,
  ): Node {
    const panel = this.createGraphicsNode(name, parent, position, width, height);
    const graphics = panel.addComponent(Graphics);
    graphics.lineWidth = 6;
    graphics.fillColor = fillColor;
    graphics.strokeColor = COLORS.outline;
    graphics.roundRect(-width / 2, -height / 2, width, height, radius);
    graphics.fill();
    graphics.stroke();
    return panel;
  }

  private createLabel(
    name: string,
    parent: Node,
    value: string,
    fontSize: number,
    width: number,
    height: number,
    position: Vec3,
    color = COLORS.outline,
  ): Node {
    const node = this.createNode(name, parent, position, width, height);
    const label = node.addComponent(Label);
    label.string = value;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
    label.color = color;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    return node;
  }

  private loadSprite(
    parent: Node,
    path: string,
    width: number,
    height: number,
    name = "Icon",
  ): void {
    const node = this.createNode(name, parent, Vec3.ZERO, width, height);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = true;

    if (EDITOR) {
      return;
    }

    resources.load(path, SpriteFrame, (error, spriteFrame) => {
      if (error) {
        console.warn(`[PortraitHud] Unable to load ${path}`, error);
        return;
      }
      if (node.isValid) {
        sprite.spriteFrame = spriteFrame;
      }
    });
  }

  private createGraphicsNode(
    name: string,
    parent: Node,
    position: Vec3,
    width: number,
    height: number,
  ): Node {
    return this.createNode(name, parent, position, width, height);
  }

  private createNode(
    name: string,
    parent: Node,
    position: Vec3,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    // Generated HUD nodes stay visible in Creator without bloating scene JSON.
    node._objFlags |= DONT_SAVE_OBJECT_FLAG;
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(position);
    node.addComponent(UITransform).setContentSize(width, height);
    return node;
  }

  private drawStar(graphics: Graphics, outerRadius: number, innerRadius: number): void {
    graphics.lineWidth = 6;
    graphics.fillColor = COLORS.yellow;
    graphics.strokeColor = COLORS.outline;

    for (let index = 0; index < 10; index += 1) {
      const radius = index % 2 === 0 ? outerRadius : innerRadius;
      const angle = Math.PI / 2 + (index * Math.PI) / 5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.close();
    graphics.fill();
    graphics.stroke();
  }
}
