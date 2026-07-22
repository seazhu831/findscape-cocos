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
  private chromeRoot: Node | null = null;
  private topBar: Node | null = null;
  private targetPanel: Node | null = null;
  private targetPanelExpanded = true;
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

    this.chromeRoot = this.createNode(
      "ChromeRoot",
      this.node,
      Vec3.ZERO,
      1080,
      1920,
    );
    this.chromeRoot.addComponent(UIOpacity);

    this.topBar = this.createRoundedPanel(
      "TopBar",
      640,
      112,
      36,
      new Vec3(0, 830, 0),
      this.chromeRoot,
    );
    this.buildTopBar(this.topBar);

    this.targetPanel = this.createRoundedPanel(
      "TargetPanel",
      560,
      150,
      38,
      new Vec3(0, -820, 0),
      this.chromeRoot,
    );
    this.buildTargetList(this.targetPanel);

    this.buildToolButton(
      "HintButton",
      new Vec3(-430, -620, 0),
      "art/icons/tool_hint/spriteFrame",
    );
    this.buildToolButton(
      "MagnifierButton",
      new Vec3(430, -620, 0),
      "art/icons/tool_magnifier/spriteFrame",
    );
    this.buildTargetPanelToggle();
  }

  private buildTopBar(parent: Node): void {
    const clock = this.createGraphicsNode(
      "Clock",
      parent,
      new Vec3(-260, 0, 0),
      58,
      58,
    );
    const clockGraphics = clock.addComponent(Graphics);
    clockGraphics.lineWidth = 5;
    clockGraphics.fillColor = COLORS.sky;
    clockGraphics.strokeColor = COLORS.outline;
    clockGraphics.circle(0, 0, 27);
    clockGraphics.fill();
    clockGraphics.stroke();
    clockGraphics.moveTo(0, 14);
    clockGraphics.lineTo(0, 0);
    clockGraphics.lineTo(12, -7);
    clockGraphics.stroke();

    this.timerNode = this.createLabel(
      "Timer",
      parent,
      "1:00",
      46,
      130,
      66,
      new Vec3(-180, 0, 0),
    );
    this.timerLabel = this.timerNode.getComponent(Label);

    const star = this.createGraphicsNode(
      "ScoreStar",
      parent,
      new Vec3(-64, 0, 0),
      58,
      58,
    );
    this.drawStar(star.addComponent(Graphics), 27, 13);
    this.scoreLabel = this.createLabel(
      "Score",
      parent,
      "0",
      46,
      140,
      66,
      new Vec3(36, 0, 0),
    ).getComponent(Label);

    const combo = this.createRoundedPanel(
      "ComboPill",
      116,
      72,
      32,
      new Vec3(238, 0, 0),
      parent,
      COLORS.coral,
    );
    this.comboLabel = this.createLabel(
      "Combo",
      combo,
      "x0",
      40,
      96,
      60,
      Vec3.ZERO,
      COLORS.white,
    ).getComponent(Label);
  }

  private buildTargetList(parent: Node): void {
    const slotXs = [-300, -150, 0, 150, 300];

    ICON_SLOTS.forEach((slot, index) => {
      const slotNode = this.createNode(
        `TargetSlot_${slot.typeId}`,
        parent,
        new Vec3(slotXs[index], 0, 0),
        108,
        108,
      );
      this.loadSprite(slotNode, slot.path, 88, 88);

      const badge = this.createGraphicsNode(
        "CountBadge",
        slotNode,
        new Vec3(36, 36, 0),
        48,
        48,
      );
      const badgeGraphics = badge.addComponent(Graphics);
      badgeGraphics.lineWidth = 4;
      badgeGraphics.fillColor = COLORS.berry;
      badgeGraphics.strokeColor = COLORS.outline;
      badgeGraphics.circle(0, 0, 22);
      badgeGraphics.fill();
      badgeGraphics.stroke();
      this.createLabel(
        "Count",
        badge,
        String(slot.count),
        30,
        42,
        42,
        Vec3.ZERO,
        COLORS.white,
      );
    });
  }

  public render(
    viewModel: RoundHudViewModel,
    pendingFoundCountsByType: ReadonlyMap<string, number> = new Map(),
  ): void {
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

    const targetPanel = this.targetPanel;
    if (!targetPanel) {
      return;
    }
    for (const slotNode of targetPanel.children) {
      slotNode.active = false;
    }

    const spacing = 150;
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
      const displayedFoundCount = Math.max(
        0,
        item.foundCount - (pendingFoundCountsByType.get(item.typeId) ?? 0),
      );
      slotNode.active = true;
      slotNode.setPosition(startX + index * spacing, 0, 0);
      countLabel.string = String(
        Math.max(0, item.requiredCount - displayedFoundCount),
      );
      const opacity =
        slotNode.getComponent(UIOpacity) ?? slotNode.addComponent(UIOpacity);
      opacity.opacity = displayedFoundCount >= item.requiredCount ? 120 : 255;
    });
  }

  public getHintButton(): Node | null {
    return this.chromeRoot?.getChildByName("HintButton") ?? null;
  }

  public getMagnifierButton(): Node | null {
    return this.chromeRoot?.getChildByName("MagnifierButton") ?? null;
  }

  public getTargetPanelToggle(): Node | null {
    return this.node.getChildByName("TargetPanelToggle");
  }

  public getTargetArrivalNode(typeId: string): Node | null {
    const slot = this.targetPanel?.getChildByName(`TargetSlot_${typeId}`) ?? null;
    if (this.targetPanelExpanded && this.targetPanel?.active && slot?.active) {
      return slot;
    }
    return this.getTargetPanelToggle();
  }

  public playTargetArrival(typeId: string, durationSeconds: number): void {
    const arrivalNode = this.getTargetArrivalNode(typeId);
    if (!arrivalNode) {
      return;
    }
    Tween.stopAllByTarget(arrivalNode);
    arrivalNode.setScale(1, 1, 1);
    const halfDuration = Math.max(0.05, durationSeconds / 2);
    tween(arrivalNode)
      .to(
        halfDuration,
        { scale: new Vec3(1.2, 1.2, 1) },
        { easing: "sineOut" },
      )
      .to(
        halfDuration,
        { scale: new Vec3(1, 1, 1) },
        { easing: "sineIn" },
      )
      .start();
  }

  public toggleTargetPanel(): void {
    this.targetPanelExpanded = !this.targetPanelExpanded;
    if (this.targetPanel) {
      this.targetPanel.active = this.targetPanelExpanded;
    }
    this.drawTargetPanelToggle();
  }

  public setMapInteractionActive(active: boolean): void {
    const opacity = this.chromeRoot?.getComponent(UIOpacity);
    if (opacity) {
      opacity.opacity = active ? 48 : 255;
    }
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
    if (!this.chromeRoot) {
      return;
    }
    const button = this.createGraphicsNode(
      name,
      this.chromeRoot,
      position,
      140,
      140,
    );
    const graphics = button.addComponent(Graphics);
    graphics.lineWidth = 5;
    graphics.fillColor = COLORS.panel;
    graphics.strokeColor = COLORS.outline;
    graphics.circle(0, 0, 64);
    graphics.fill();
    graphics.stroke();
    this.loadSprite(button, iconPath, 94, 94, "Icon");
    const badge = this.createRoundedPanel(
      "UsesBadge",
      48,
      48,
      24,
      new Vec3(44, 44, 0),
      button,
      COLORS.berry,
    );
    this.createLabel("Uses", badge, "0", 28, 40, 40, Vec3.ZERO, COLORS.white);
    const cooldown = this.createRoundedPanel(
      "CooldownPill",
      96,
      44,
      22,
      new Vec3(0, -48, 0),
      button,
      COLORS.outline,
    );
    cooldown.active = false;
    this.createLabel("Cooldown", cooldown, "", 26, 84, 38, Vec3.ZERO, COLORS.white);
  }

  private buildTargetPanelToggle(): void {
    const button = this.createGraphicsNode(
      "TargetPanelToggle",
      this.node,
      new Vec3(0, -710, 0),
      120,
      120,
    );
    button.addComponent(Graphics);
    this.drawTargetPanelToggle();
  }

  private drawTargetPanelToggle(): void {
    const graphics = this.getTargetPanelToggle()?.getComponent(Graphics);
    if (!graphics) {
      return;
    }
    graphics.clear();
    graphics.lineWidth = 6;
    graphics.fillColor = COLORS.panel;
    graphics.strokeColor = COLORS.outline;
    graphics.circle(0, 0, 36);
    graphics.fill();
    graphics.stroke();
    const direction = this.targetPanelExpanded ? -1 : 1;
    graphics.moveTo(-14, 7 * direction);
    graphics.lineTo(0, -7 * direction);
    graphics.lineTo(14, 7 * direction);
    graphics.stroke();
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
