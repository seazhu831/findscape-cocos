import {
  Layers,
  Node,
  resources,
  Sprite,
  SpriteFrame,
  UITransform,
  Vec3,
} from "cc";
import type {
  MapConfig,
  SceneEntityConfig,
  SceneLayerId,
} from "../config/gameplay-schema";
import {
  SCENE_LAYER_ORDER,
  type SceneEntityRegistry,
} from "./scene-entity-runtime";

const DONT_SAVE_OBJECT_FLAG = 8;

export class PortraitSceneEntityBinder {
  private readonly rootsByLayer = new Map<SceneLayerId, Node>();
  private readonly nodesByEntityId = new Map<string, Node>();
  private readonly visualNodesByEntityId = new Map<string, Node>();
  private readonly targetIdsByNode = new Map<Node, string>();
  private readonly renderOrdersByNode = new Map<Node, number>();
  private readonly ownedNodes = new Set<Node>();

  constructor(private readonly mapWorld: Node) {}

  public async initialize(
    registry: SceneEntityRegistry,
    map: MapConfig,
  ): Promise<void> {
    this.createLayerRoots(map);
    this.bindBackground();

    for (const state of registry.getAll()) {
      const node =
        this.findExistingNode(state.targetId, state.entity.entityId) ??
        (await this.createEntityNode(state.entity));
      this.bindNode(node, state.entity, map);
      this.nodesByEntityId.set(state.entity.entityId, node);
      this.visualNodesByEntityId.set(
        state.entity.entityId,
        this.ensureVisualNode(node),
      );
      if (state.targetId) {
        this.targetIdsByNode.set(node, state.targetId);
      }
    }
    this.sortLayerChildren();
    this.apply(registry);
  }

  public apply(registry: SceneEntityRegistry): void {
    for (const state of registry.getAll()) {
      const node = this.nodesByEntityId.get(state.entity.entityId);
      if (node) {
        node.active = state.active;
      }
    }
  }

  public getNodeByEntityId(entityId: string): Node | undefined {
    return this.nodesByEntityId.get(entityId);
  }

  public getVisualNodeByEntityId(entityId: string): Node | undefined {
    return this.visualNodesByEntityId.get(entityId);
  }

  public getNodeByTargetId(targetId: string): Node | undefined {
    for (const [node, mappedTargetId] of this.targetIdsByNode) {
      if (mappedTargetId === targetId) {
        return node;
      }
    }
    return undefined;
  }

  public getTargetIdForNode(node: Node): string | undefined {
    return this.targetIdsByNode.get(node);
  }

  public getTargetNodes(): Map<string, Node> {
    const result = new Map<string, Node>();
    for (const [node, targetId] of this.targetIdsByNode) {
      result.set(targetId, node);
    }
    return result;
  }

  public getInstantiatedNodeCount(): number {
    return this.nodesByEntityId.size;
  }

  public estimateResidentTextureBytes(): number {
    const framesByUuid = new Map<string, SpriteFrame>();
    for (const visual of this.visualNodesByEntityId.values()) {
      const frame = visual.getComponent(Sprite)?.spriteFrame;
      if (frame) {
        framesByUuid.set(frame.uuid, frame);
      }
    }
    let bytes = 0;
    for (const frame of framesByUuid.values()) {
      bytes += frame.originalSize.width * frame.originalSize.height * 4;
    }
    return bytes;
  }

  public dispose(): void {
    for (const node of this.ownedNodes) {
      if (node.isValid) {
        node.destroy();
      }
    }
    for (const root of this.rootsByLayer.values()) {
      if (root.isValid) {
        root.destroy();
      }
    }
    this.ownedNodes.clear();
    this.rootsByLayer.clear();
    this.nodesByEntityId.clear();
    this.visualNodesByEntityId.clear();
    this.targetIdsByNode.clear();
    this.renderOrdersByNode.clear();
  }

  private createLayerRoots(map: MapConfig): void {
    for (const layer of SCENE_LAYER_ORDER) {
      const root = new Node(toLayerRootName(layer));
      root._objFlags |= DONT_SAVE_OBJECT_FLAG;
      root.layer = Layers.Enum.UI_2D;
      root.addComponent(UITransform).setContentSize(
        map.worldSize.width,
        map.worldSize.height,
      );
      this.mapWorld.addChild(root);
      root.setSiblingIndex(this.rootsByLayer.size);
      this.rootsByLayer.set(layer, root);
    }
  }

  private bindBackground(): void {
    const background = this.mapWorld.getChildByName("Map");
    const root = this.rootsByLayer.get("background");
    if (background && root) {
      background.setParent(root);
      background.setSiblingIndex(0);
    }
  }

  private findExistingNode(
    targetId: string | undefined,
    entityId: string,
  ): Node | undefined {
    return (
      (targetId ? this.mapWorld.getChildByName(targetId) : undefined) ??
      this.mapWorld.getChildByName(entityId) ??
      undefined
    );
  }

  private async createEntityNode(entity: SceneEntityConfig): Promise<Node> {
    const spriteFrame = await loadSpriteFrame(entity.asset);
    const node = new Node(entity.entityId);
    node._objFlags |= DONT_SAVE_OBJECT_FLAG;
    node.layer = Layers.Enum.UI_2D;
    node.addComponent(UITransform);
    const sprite = node.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.RAW;
    sprite.spriteFrame = spriteFrame;
    this.ownedNodes.add(node);
    return node;
  }

  private bindNode(
    node: Node,
    entity: SceneEntityConfig,
    map: MapConfig,
  ): void {
    const root = this.rootsByLayer.get(entity.render.layer);
    if (!root) {
      throw new Error(`Missing scene layer root: ${entity.render.layer}`);
    }
    node.setParent(root);
    node.layer = Layers.Enum.UI_2D;
    node.setPosition(
      entity.transform.position.x - map.worldSize.width / 2,
      map.worldSize.height / 2 - entity.transform.position.y,
      0,
    );
    const scale = entity.transform.scale ?? { x: 1, y: 1 };
    node.setScale(new Vec3(scale.x, scale.y, 1));
    node.angle = -(entity.transform.rotationDegrees ?? 0);
    const anchor = entity.transform.anchor;
    const transform = node.getComponent(UITransform);
    if (anchor && transform) {
      transform.setAnchorPoint(anchor.x, anchor.y);
    }
    this.renderOrdersByNode.set(node, entity.render.order);
  }

  private ensureVisualNode(node: Node): Node {
    const existing = node.getChildByName("SceneEntityVisual");
    if (existing) {
      return existing;
    }
    const visual = new Node("SceneEntityVisual");
    visual._objFlags |= DONT_SAVE_OBJECT_FLAG;
    visual.layer = Layers.Enum.UI_2D;
    const sourceTransform = node.getComponent(UITransform);
    const visualTransform = visual.addComponent(UITransform);
    if (sourceTransform) {
      visualTransform.setContentSize(sourceTransform.contentSize);
      visualTransform.setAnchorPoint(
        sourceTransform.anchorPoint.x,
        sourceTransform.anchorPoint.y,
      );
    }
    const sourceSprite = node.getComponent(Sprite);
    if (sourceSprite) {
      const visualSprite = visual.addComponent(Sprite);
      visualSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      visualSprite.spriteFrame = sourceSprite.spriteFrame;
      visualSprite.color = sourceSprite.color.clone();
      sourceSprite.enabled = false;
    }
    node.addChild(visual);
    visual.setPosition(0, 0, 0);
    return visual;
  }

  private sortLayerChildren(): void {
    for (const [layer, root] of this.rootsByLayer) {
      if (layer === "background") {
        continue;
      }
      [...root.children]
        .sort((left, right) => {
          const orderDifference =
            (this.renderOrdersByNode.get(left) ?? 0) -
            (this.renderOrdersByNode.get(right) ?? 0);
          return orderDifference !== 0
            ? orderDifference
            : left.name.localeCompare(right.name);
        })
        .forEach((child, index) => child.setSiblingIndex(index));
    }
  }
}

function toLayerRootName(layer: SceneLayerId): string {
  return `SceneLayer_${layer}`;
}

function loadSpriteFrame(assetPath: string): Promise<SpriteFrame> {
  return new Promise((resolve, reject) => {
    resources.load(`${assetPath}/spriteFrame`, SpriteFrame, (error, asset) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(asset);
    });
  });
}
