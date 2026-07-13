import {
  _decorator,
  BlockInputEvents,
  Color,
  Component,
  Graphics,
  Label,
  Layers,
  Node,
  UITransform,
  Vec3,
} from "cc";
import type { ModeVariantSummary } from "../config/mode-capabilities";

const { ccclass } = _decorator;

const COLORS = {
  overlay: new Color(48, 55, 61, 208),
  outline: new Color(107, 87, 68, 255),
  panel: new Color(253, 246, 230, 255),
  coral: new Color(240, 138, 122, 255),
  sky: new Color(143, 193, 227, 255),
  berry: new Color(192, 82, 107, 255),
  white: new Color(255, 255, 255, 255),
};

@ccclass("PortraitModeSelect")
export class PortraitModeSelect extends Component {
  private modeButtons = new Map<string, Node>();
  private built = false;

  public show(summaries: ModeVariantSummary[]): void {
    this.ensureBuilt(summaries);
    this.node.active = true;
  }

  public hide(): void {
    this.node.active = false;
  }

  public getModeButtons(): Map<string, Node> {
    return this.modeButtons;
  }

  private ensureBuilt(summaries: ModeVariantSummary[]): void {
    if (this.built) {
      return;
    }
    this.built = true;
    this.node.layer = Layers.Enum.UI_2D;
    this.node.addComponent(BlockInputEvents);
    this.setSize(this.node, 1080, 1920);

    const backdrop = this.createNode("Backdrop", this.node, Vec3.ZERO, 1080, 1920);
    const backdropGraphics = backdrop.addComponent(Graphics);
    backdropGraphics.fillColor = COLORS.overlay;
    backdropGraphics.rect(-540, -960, 1080, 1920);
    backdropGraphics.fill();

    const panel = this.createNode("Panel", this.node, Vec3.ZERO, 880, 1180);
    const panelGraphics = panel.addComponent(Graphics);
    panelGraphics.lineWidth = 8;
    panelGraphics.fillColor = COLORS.panel;
    panelGraphics.strokeColor = COLORS.outline;
    panelGraphics.roundRect(-440, -590, 880, 1180, 48);
    panelGraphics.fill();
    panelGraphics.stroke();

    this.createLabel(
      "Title", panel, "CHOOSE MODE", 70, 720, 100,
      new Vec3(0, 470, 0), COLORS.coral,
    );

    const fills = [COLORS.coral, COLORS.sky, COLORS.berry];
    summaries.forEach((summary, index) => {
      const button = this.createNode(
        `ModeButton_${summary.modeId}`,
        panel,
        new Vec3(0, 270 - index * 290, 0),
        700,
        230,
      );
      const graphics = button.addComponent(Graphics);
      graphics.lineWidth = 6;
      graphics.fillColor = fills[index % fills.length];
      graphics.strokeColor = COLORS.outline;
      graphics.roundRect(-350, -115, 700, 230, 40);
      graphics.fill();
      graphics.stroke();
      this.createLabel(
        "Name", button, summary.name.toUpperCase(), 48, 610, 68,
        new Vec3(0, 45, 0), COLORS.white,
      );
      this.createLabel(
        "TargetCount", button, `${summary.selectedTargetCount} TARGETS`,
        34, 610, 48, new Vec3(0, -12, 0), COLORS.white,
      );
      this.createLabel(
        "Rule", button, summary.targetSelectionLabel.toUpperCase(),
        28, 610, 48, new Vec3(0, -62, 0), COLORS.white,
      );
      this.modeButtons.set(summary.modeId, button);
    });
  }

  private createNode(
    name: string,
    parent: Node,
    position: Vec3,
    width: number,
    height: number,
  ): Node {
    const node = new Node(name);
    node.layer = Layers.Enum.UI_2D;
    parent.addChild(node);
    node.setPosition(position);
    this.setSize(node, width, height);
    return node;
  }

  private createLabel(
    name: string,
    parent: Node,
    value: string,
    fontSize: number,
    width: number,
    height: number,
    position: Vec3,
    color: Color,
  ): Label {
    const node = this.createNode(name, parent, position, width, height);
    const label = node.addComponent(Label);
    label.string = value;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 6;
    label.color = color;
    label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER;
    label.overflow = Label.Overflow.SHRINK;
    return label;
  }

  private setSize(node: Node, width: number, height: number): void {
    const transform = node.getComponent(UITransform) ?? node.addComponent(UITransform);
    transform.setContentSize(width, height);
  }
}
