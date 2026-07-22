import {
  Color,
  Graphics,
  Label,
  Layers,
  Node,
  UITransform,
  Vec3,
} from "cc";
import type { SceneRuntimeDiagnosticsSnapshot } from "../gameplay/scene-runtime-diagnostics";

const DONT_SAVE_OBJECT_FLAG = 8;

export class PortraitSceneDiagnostics {
  private readonly root: Node;
  private readonly label: Label;

  constructor(parent: Node) {
    this.root = createNode("SceneDiagnostics", parent, new Vec3(-335, 555), 360, 350);
    const graphics = this.root.addComponent(Graphics);
    graphics.fillColor = new Color(30, 34, 38, 224);
    graphics.strokeColor = new Color(255, 255, 255, 120);
    graphics.lineWidth = 3;
    graphics.rect(-180, -175, 360, 350);
    graphics.fill();
    graphics.stroke();

    const labelNode = createNode("Metrics", this.root, Vec3.ZERO, 320, 310);
    this.label = labelNode.addComponent(Label);
    this.label.fontSize = 25;
    this.label.lineHeight = 32;
    this.label.color = Color.WHITE;
    this.label.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.label.verticalAlign = Label.VerticalAlign.TOP;
    this.label.overflow = Label.Overflow.SHRINK;
  }

  public render(snapshot: SceneRuntimeDiagnosticsSnapshot): void {
    const layers = snapshot.activeEntityCountByLayer;
    const timing = snapshot.frameTiming;
    this.label.string = [
      `REGIONS  ${snapshot.activeRegionCount}/${snapshot.regionCount}`,
      `ENTITIES ${snapshot.activeEntityCount}/${snapshot.entityCount}`,
      `VISIBLE  ${snapshot.visibleEntityCount}`,
      `TARGETS  ${snapshot.interactiveEntityCount}`,
      `MOTIONS  ${snapshot.scheduledMotionCount}`,
      `NODES    ${snapshot.instantiatedNodeCount}`,
      `TEXTURES ${formatBytes(snapshot.residentTextureBytesEstimate)}`,
      `FRAME    ${formatMs(timing.averageFrameTimeMs)} avg`,
      `         ${formatMs(timing.p95FrameTimeMs)} p95`,
      `LAYERS   ${layers.staticDecoration}/${layers.ambientActor}/${layers.interactive}/${layers.foregroundOccluder}`,
    ].join("\n");
  }

  public dispose(): void {
    if (this.root.isValid) {
      this.root.destroy();
    }
  }
}

function createNode(
  name: string,
  parent: Node,
  position: Vec3,
  width: number,
  height: number,
): Node {
  const node = new Node(name);
  node._objFlags |= DONT_SAVE_OBJECT_FLAG;
  node.layer = Layers.Enum.UI_2D;
  parent.addChild(node);
  node.setPosition(position);
  node.addComponent(UITransform).setContentSize(width, height);
  return node;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MiB`
    : `${Math.round(bytes / 1024)} KiB`;
}

function formatMs(milliseconds: number): string {
  return `${milliseconds.toFixed(1)} ms`;
}
