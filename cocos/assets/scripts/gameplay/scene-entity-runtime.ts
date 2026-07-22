import type {
  MapConfig,
  SceneEntityConfig,
  SceneEntitySetConfig,
  SceneLayerId,
  TargetPointConfig,
  TargetPointSetConfig,
  TargetTypeConfig,
} from "../config/gameplay-schema";

export const SCENE_LAYER_ORDER: SceneLayerId[] = [
  "background",
  "staticDecoration",
  "ambientActor",
  "interactive",
  "foregroundOccluder",
];

export interface SceneEntityRegistryInput {
  map: MapConfig;
  targetPointSet: TargetPointSetConfig;
  targetTypesById: Map<string, TargetTypeConfig>;
  sceneEntitySet?: SceneEntitySetConfig;
}

export interface SceneEntityRuntimeState {
  entity: SceneEntityConfig;
  targetId?: string;
  selected: boolean;
  active: boolean;
  interactive: boolean;
  found: boolean;
  legacyFallback: boolean;
}

export class SceneEntityRegistry {
  private readonly statesByEntityId = new Map<
    string,
    SceneEntityRuntimeState
  >();
  private readonly entityIdsByTargetId = new Map<string, string>();
  private selectedTargetIds = new Set<string>();

  constructor(input: SceneEntityRegistryInput) {
    const configuredEntities = input.sceneEntitySet?.entities ?? [];
    for (const entity of configuredEntities) {
      this.addEntity(entity, false);
    }

    input.targetPointSet.targetPoints.forEach((target, index) => {
      const entityId = target.entityId ?? createLegacyEntityId(target.targetId);
      if (!this.statesByEntityId.has(entityId)) {
        this.addEntity(
          createLegacyTargetEntity(input, target, entityId, index),
          true,
        );
      }
      this.entityIdsByTargetId.set(target.targetId, entityId);
      const state = this.statesByEntityId.get(entityId);
      if (state) {
        state.targetId = target.targetId;
      }
    });
  }

  projectMode(selectedTargets: TargetPointConfig[]): void {
    this.selectedTargetIds = new Set(
      selectedTargets.map((target) => target.targetId),
    );
    this.resetRound();
  }

  resetRound(): void {
    for (const state of this.statesByEntityId.values()) {
      const selected = Boolean(
        state.targetId && this.selectedTargetIds.has(state.targetId),
      );
      const activationPolicy = state.entity.activationPolicy ?? "always";
      const policyAllowsActivation =
        activationPolicy !== "modeSelected" || selected;
      state.selected = selected;
      state.active =
        state.entity.render.visibleByDefault && policyAllowsActivation;
      state.interactive =
        state.active && selected && state.entity.kind === "interactive";
      state.found = false;
    }
  }

  markTargetFound(targetId: string): SceneEntityRuntimeState | undefined {
    const state = this.getByTargetId(targetId);
    if (!state || !state.interactive) {
      return undefined;
    }
    state.found = true;
    state.interactive = false;
    return state;
  }

  get(entityId: string): SceneEntityRuntimeState | undefined {
    return this.statesByEntityId.get(entityId);
  }

  getByTargetId(targetId: string): SceneEntityRuntimeState | undefined {
    const entityId = this.entityIdsByTargetId.get(targetId);
    return entityId ? this.statesByEntityId.get(entityId) : undefined;
  }

  getAll(): SceneEntityRuntimeState[] {
    const layerOrder = new Map(
      SCENE_LAYER_ORDER.map((layer, index) => [layer, index]),
    );
    return Array.from(this.statesByEntityId.values()).sort((left, right) => {
      const layerDifference =
        (layerOrder.get(left.entity.render.layer) ?? 0) -
        (layerOrder.get(right.entity.render.layer) ?? 0);
      if (layerDifference !== 0) {
        return layerDifference;
      }
      const orderDifference =
        left.entity.render.order - right.entity.render.order;
      return orderDifference !== 0
        ? orderDifference
        : left.entity.entityId.localeCompare(right.entity.entityId);
    });
  }

  getLayer(layer: SceneLayerId): SceneEntityRuntimeState[] {
    return this.getAll().filter((state) => state.entity.render.layer === layer);
  }

  private addEntity(entity: SceneEntityConfig, legacyFallback: boolean): void {
    if (this.statesByEntityId.has(entity.entityId)) {
      throw new Error(`Duplicate scene entity: ${entity.entityId}`);
    }
    this.statesByEntityId.set(entity.entityId, {
      entity,
      selected: false,
      active: false,
      interactive: false,
      found: false,
      legacyFallback,
    });
  }
}

function createLegacyEntityId(targetId: string): string {
  return `legacy_target_${targetId}`;
}

function createLegacyTargetEntity(
  input: SceneEntityRegistryInput,
  target: TargetPointConfig,
  entityId: string,
  order: number,
): SceneEntityConfig {
  const targetType = input.targetTypesById.get(target.typeId);
  if (!targetType) {
    throw new Error(`Unknown target type for legacy entity: ${target.typeId}`);
  }
  return {
    entityId,
    mapId: input.map.mapId,
    kind: "interactive",
    asset: targetType.targetAsset,
    transform: {
      position: target.position,
      anchor: { x: 0.5, y: 0.5 },
    },
    render: {
      layer: "interactive",
      order,
      visibleByDefault: true,
    },
    activationPolicy: "modeSelected",
    tags: [...target.tags, "legacy-target-entity"],
  };
}
