export type AssetPath = string;
export type MapId = string;
export type TargetPointSetId = string;
export type TargetPointId = string;
export type TargetTypeId = string;
export type GameModeId = string;
export type FeedbackPresetId = string;
export type ScoringRuleId = string;
export type ToolId = string;
export type SceneEntitySetId = string;
export type SceneEntityId = string;
export type MotionProfileId = string;

export interface Vector2Config {
  x: number;
  y: number;
}

export interface SizeConfig {
  width: number;
  height: number;
}

export interface CameraConfig {
  center: Vector2Config;
  zoom: number;
}

export interface MapConfig {
  mapId: MapId;
  name: string;
  theme: string;
  assetBundle: string;
  backgroundAsset: AssetPath;
  worldSize: SizeConfig;
  defaultCamera: CameraConfig;
  minZoom: number;
  maxZoom: number;
  targetPointSetId: TargetPointSetId;
  sceneEntitySetId?: SceneEntitySetId;
}

export type SceneLayerId =
  | "background"
  | "staticDecoration"
  | "ambientActor"
  | "interactive"
  | "foregroundOccluder";

export type SceneEntityKind =
  | "decoration"
  | "actor"
  | "interactive"
  | "occluder";

export interface SceneEntityTransformConfig {
  position: Vector2Config;
  scale?: Vector2Config;
  rotationDegrees?: number;
  anchor?: Vector2Config;
}

export interface SceneEntityRenderConfig {
  layer: SceneLayerId;
  order: number;
  visibleByDefault: boolean;
}

export type SceneEntityActivationPolicy =
  | "always"
  | "nearViewport"
  | "modeSelected";

export interface SceneEntityConfig {
  entityId: SceneEntityId;
  mapId: MapId;
  kind: SceneEntityKind;
  asset: AssetPath;
  transform: SceneEntityTransformConfig;
  render: SceneEntityRenderConfig;
  motionProfileId?: MotionProfileId;
  activationPolicy?: SceneEntityActivationPolicy;
  tags: string[];
}

export interface SceneEntitySetConfig {
  sceneEntitySetId: SceneEntitySetId;
  mapId: MapId;
  entities: SceneEntityConfig[];
}

export type MotionOffscreenPolicy = "pause" | "reducedRate" | "continue";
export type TweenMotionEasing =
  | "linear"
  | "sineInOut"
  | "quadInOut"
  | "backInOut";

export interface TweenMotionVariantConfig {
  variantId: string;
  driver: "tween";
  durationMs: number;
  offset?: Vector2Config;
  rotationDegrees?: number;
  scaleMultiplier?: Vector2Config;
  easing?: TweenMotionEasing;
  yoyo: boolean;
  loop: boolean;
}

export interface SpriteFramesMotionVariantConfig {
  variantId: string;
  driver: "spriteFrames";
  frameAssets: AssetPath[];
  framesPerSecond: number;
  loop: boolean;
}

export interface AnimationClipMotionVariantConfig {
  variantId: string;
  driver: "animationClip";
  clipAsset: AssetPath;
  speed: number;
  loop: boolean;
}

export type MotionVariantConfig =
  | TweenMotionVariantConfig
  | SpriteFramesMotionVariantConfig
  | AnimationClipMotionVariantConfig;

export interface MotionProfileConfig {
  motionProfileId: MotionProfileId;
  idleVariants: MotionVariantConfig[];
  startDelayMinMs?: number;
  startDelayMaxMs?: number;
  offscreenPolicy: MotionOffscreenPolicy;
}

export type HitShapeType = "circle" | "rectangle" | "polygon" | "spriteBounds";

export interface CircleHitShape {
  type: "circle";
  radius: number;
}

export interface RectangleHitShape {
  type: "rectangle";
  width: number;
  height: number;
}

export interface PolygonHitShape {
  type: "polygon";
  points: Vector2Config[];
}

export interface SpriteBoundsHitShape {
  type: "spriteBounds";
  padding: number;
}

export type HitShape =
  | CircleHitShape
  | RectangleHitShape
  | PolygonHitShape
  | SpriteBoundsHitShape;

export type VisibilityRule =
  | "alwaysVisible"
  | "hiddenUntilHint"
  | "camouflaged"
  | "modeControlled";

export type TriggerBehavior =
  | "tapToFind"
  | "tapToPop"
  | "tapToCatch"
  | "dragToCatch";

export interface RewardConfig {
  score: number;
  comboValue?: number;
}

export interface TargetPointConfig {
  targetId: TargetPointId;
  mapId: MapId;
  typeId: TargetTypeId;
  entityId?: SceneEntityId;
  position: Vector2Config;
  hitShape: HitShape;
  difficulty: 1 | 2 | 3 | 4 | 5;
  visibilityRule: VisibilityRule;
  triggerBehavior: TriggerBehavior;
  feedbackPresetId: FeedbackPresetId;
  reward: RewardConfig;
  concealment?: TargetConcealmentConfig;
  tags: string[];
}

export interface TargetConcealmentConfig {
  occluderEntityIds: SceneEntityId[];
  intendedVisibleRatio?: number;
  visualSimilarityTags?: string[];
  edgePlacement?: "none" | "soft" | "strong";
  scaleClass?: "small" | "medium" | "large";
}

export interface TargetPointSetConfig {
  targetPointSetId: TargetPointSetId;
  mapId: MapId;
  targetPoints: TargetPointConfig[];
}

export interface TargetTypeConfig {
  typeId: TargetTypeId;
  displayName: string;
  iconAsset: AssetPath;
  targetAsset: AssetPath;
  defaultFeedbackPresetId: FeedbackPresetId;
  defaultScore: number;
  tags: string[];
}

export type FeedbackVisual =
  | "ring"
  | "sparkle"
  | "flyToList"
  | "burst"
  | "puff"
  | "stamp"
  | "pulse"
  | "shake";

export interface FeedbackPresetConfig {
  feedbackPresetId: FeedbackPresetId;
  name: string;
  visuals: FeedbackVisual[];
  soundAsset?: AssetPath;
  durationMs: number;
}

export interface ComboRuleConfig {
  windowMs: number;
  bonusPerStreak: number;
  maxBonus: number;
}

export interface TimeBonusRuleConfig {
  pointsPerSecondRemaining: number;
  maxBonus: number;
}

export interface ScoringRuleConfig {
  scoringRuleId: ScoringRuleId;
  correctHitScore: number;
  wrongTapPenalty: number;
  combo: ComboRuleConfig;
  timeBonus: TimeBonusRuleConfig;
}

export interface ToolConfig {
  toolId: ToolId;
  name: string;
  usesPerRound: number;
  cooldownSeconds: number;
  effect: "highlightTarget" | "zoomArea" | "extendTime";
  durationSeconds?: number;
  value?: number;
  iconAsset: AssetPath;
}

export type TargetSelectionRule =
  | {
      type: "byCategoryCounts";
      countsByType: Record<TargetTypeId, number>;
    }
  | {
      type: "byTag";
      tag: string;
      count: number;
    }
  | {
      type: "allOfType";
      typeId: TargetTypeId;
    };

export interface ModeFeedbackOverride {
  triggerBehavior?: TriggerBehavior;
  feedbackPresetId?: FeedbackPresetId;
}

export interface GameModeConfig {
  modeId: GameModeId;
  name: string;
  description: string;
  mapId: MapId;
  targetSelectionRule: TargetSelectionRule;
  timeLimitSeconds: number;
  scoringRuleId: ScoringRuleId;
  toolIds: ToolId[];
  successRule: "findAllSelectedTargets" | "reachTargetCount";
  failureRule: "timeExpired";
  feedbackOverrides: Record<TargetTypeId, ModeFeedbackOverride>;
}

export interface GameplayConfig {
  version: 1;
  maps: MapConfig[];
  targetTypes: TargetTypeConfig[];
  targetPointSets: TargetPointSetConfig[];
  sceneEntitySets?: SceneEntitySetConfig[];
  motionProfiles?: MotionProfileConfig[];
  feedbackPresets: FeedbackPresetConfig[];
  scoringRules: ScoringRuleConfig[];
  tools: ToolConfig[];
  gameModes: GameModeConfig[];
}
