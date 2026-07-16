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
import type { SettlementViewModel } from "./round-view-model";

const { ccclass } = _decorator;

const COLORS = {
  overlay: new Color(48, 55, 61, 184),
  outline: new Color(107, 87, 68, 255),
  panel: new Color(253, 246, 230, 255),
  coral: new Color(240, 138, 122, 255),
  sky: new Color(143, 193, 227, 255),
  yellow: new Color(242, 201, 76, 255),
  muted: new Color(188, 176, 160, 255),
  white: new Color(255, 255, 255, 255),
};

@ccclass("PortraitSettlement")
export class PortraitSettlement extends Component {
  private titleLabel: Label | null = null;
  private scoreLabel: Label | null = null;
  private bestLabel: Label | null = null;
  private progressLabel: Label | null = null;
  private accuracyLabel: Label | null = null;
  private retryButton: Node | null = null;
  private modesButton: Node | null = null;
  private starGraphics: Graphics[] = [];
  private built = false;

  public show(
    viewModel: SettlementViewModel,
    bestScore?: number,
    isNewBest = false,
  ): void {
    this.ensureBuilt();
    this.node.active = true;

    if (this.titleLabel) {
      this.titleLabel.string =
        viewModel.status === "completed" ? "ROUND COMPLETE" : "TIME UP";
    }
    if (this.scoreLabel) {
      this.scoreLabel.string = String(viewModel.score);
    }
    if (this.bestLabel) {
      this.bestLabel.string = bestScore === undefined
        ? "BEST --"
        : `${isNewBest ? "NEW BEST" : "BEST"} ${bestScore}`;
    }
    if (this.progressLabel) {
      this.progressLabel.string = `${viewModel.foundCount} / ${viewModel.totalCount}`;
    }
    if (this.accuracyLabel) {
      this.accuracyLabel.string = `${Math.round(viewModel.accuracy01 * 100)}%`;
    }

    this.starGraphics.forEach((graphics, index) => {
      graphics.clear();
      this.drawStar(
        graphics,
        index < viewModel.starRating ? COLORS.yellow : COLORS.muted,
      );
    });
  }

  public hide(): void {
    this.node.active = false;
  }

  public getRetryButton(): Node {
    this.ensureBuilt();
    return this.retryButton as Node;
  }

  public getModesButton(): Node {
    this.ensureBuilt();
    return this.modesButton as Node;
  }

  private ensureBuilt(): void {
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

    const panel = this.createNode("Panel", this.node, new Vec3(0, 40, 0), 860, 940);
    const panelGraphics = panel.addComponent(Graphics);
    panelGraphics.lineWidth = 8;
    panelGraphics.fillColor = COLORS.panel;
    panelGraphics.strokeColor = COLORS.outline;
    panelGraphics.roundRect(-430, -470, 860, 940, 48);
    panelGraphics.fill();
    panelGraphics.stroke();

    this.titleLabel = this.createLabel(
      "Title", panel, "ROUND COMPLETE", 68, 720, 100,
      new Vec3(0, 342, 0), COLORS.coral,
    );

    this.starGraphics = [-145, 0, 145].map((x, index) => {
      const star = this.createNode(
        `Star_${index + 1}`, panel, new Vec3(x, 205, 0), 116, 116,
      );
      const graphics = star.addComponent(Graphics);
      this.drawStar(graphics, COLORS.muted);
      return graphics;
    });

    this.createLabel(
      "ScoreCaption", panel, "SCORE", 38, 260, 58, new Vec3(0, 88, 0),
    );
    this.scoreLabel = this.createLabel(
      "Score", panel, "0", 84, 560, 100, new Vec3(0, 6, 0), COLORS.coral,
    );
    this.bestLabel = this.createLabel(
      "BestScore", panel, "BEST --", 32, 560, 42,
      new Vec3(0, -72, 0), COLORS.outline,
    );

    const divider = this.createNode(
      "Divider", panel, new Vec3(0, -122, 0), 650, 4,
    );
    const dividerGraphics = divider.addComponent(Graphics);
    dividerGraphics.fillColor = COLORS.muted;
    dividerGraphics.roundRect(-325, -2, 650, 4, 2);
    dividerGraphics.fill();

    this.createLabel(
      "ProgressCaption", panel, "FOUND", 34, 260, 50,
      new Vec3(-190, -196, 0),
    );
    this.progressLabel = this.createLabel(
      "Progress", panel, "0 / 0", 58, 280, 72,
      new Vec3(-190, -258, 0), COLORS.coral,
    );
    this.createLabel(
      "AccuracyCaption", panel, "ACCURACY", 34, 260, 50,
      new Vec3(190, -196, 0),
    );
    this.accuracyLabel = this.createLabel(
      "Accuracy", panel, "0%", 58, 280, 72,
      new Vec3(190, -258, 0), COLORS.coral,
    );

    this.retryButton = this.createNode(
      "RetryButton", panel, new Vec3(-180, -382, 0), 320, 112,
    );
    const retryGraphics = this.retryButton.addComponent(Graphics);
    retryGraphics.lineWidth = 6;
    retryGraphics.fillColor = COLORS.coral;
    retryGraphics.strokeColor = COLORS.outline;
    retryGraphics.roundRect(-160, -56, 320, 112, 44);
    retryGraphics.fill();
    retryGraphics.stroke();
    this.createLabel(
      "RetryLabel", this.retryButton, "REPLAY", 44, 270, 78,
      Vec3.ZERO, COLORS.white,
    );

    this.modesButton = this.createNode(
      "ModesButton", panel, new Vec3(180, -382, 0), 320, 112,
    );
    const modesGraphics = this.modesButton.addComponent(Graphics);
    modesGraphics.lineWidth = 6;
    modesGraphics.fillColor = COLORS.sky;
    modesGraphics.strokeColor = COLORS.outline;
    modesGraphics.roundRect(-160, -56, 320, 112, 44);
    modesGraphics.fill();
    modesGraphics.stroke();
    this.createLabel(
      "ModesLabel", this.modesButton, "MODES", 44, 270, 78,
      Vec3.ZERO, COLORS.white,
    );
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
    color = COLORS.outline,
  ): Label {
    const node = this.createNode(name, parent, position, width, height);
    const label = node.addComponent(Label);
    label.string = value;
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 8;
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

  private drawStar(graphics: Graphics, fillColor: Color): void {
    const points = 5;
    for (let index = 0; index < points * 2; index += 1) {
      const radius = index % 2 === 0 ? 54 : 25;
      const angle = -Math.PI / 2 + (index * Math.PI) / points;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (index === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.close();
    graphics.lineWidth = 6;
    graphics.fillColor = fillColor;
    graphics.strokeColor = COLORS.outline;
    graphics.fill();
    graphics.stroke();
  }
}
