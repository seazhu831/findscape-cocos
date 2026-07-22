import {
  TARGET_ARRIVAL_DURATION_MS,
  TARGET_FLIGHT_DURATION_MS,
  TARGET_LIFT_DURATION_MS,
  cancelTargetPresentations,
  completeTargetPresentation,
  createTargetPresentationState,
  startTargetPresentation,
} from "../../cocos/assets/scripts/gameplay/target-presentation.ts";

const failures = [];

checkCollectPlan();
checkUnsupportedBehavior();
checkFinalSettlementBarrier();
checkStaleCompletion();
checkCancellation();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated 5 target presentation fixture groups");

function checkCollectPlan() {
  const start = startTargetPresentation(
    createTargetPresentationState(),
    createTarget("pineapple_a"),
    false,
  );
  expectEqual("collect plan exists", Boolean(start.plan), true);
  expectEqual("lift duration", start.plan?.liftDurationMs, TARGET_LIFT_DURATION_MS);
  expectEqual(
    "flight duration",
    start.plan?.flightDurationMs,
    TARGET_FLIGHT_DURATION_MS,
  );
  expectEqual(
    "arrival duration",
    start.plan?.arrivalDurationMs,
    TARGET_ARRIVAL_DURATION_MS,
  );
  expectEqual("active count", start.state.activeByTargetId.size, 1);
}

function checkUnsupportedBehavior() {
  const state = createTargetPresentationState();
  const start = startTargetPresentation(
    state,
    createTarget("balloon_a", "tapToPop"),
    true,
  );
  expectEqual("unsupported plan omitted", start.plan, undefined);
  expectEqual("unsupported state unchanged", start.state, state);
}

function checkFinalSettlementBarrier() {
  const first = startTargetPresentation(
    createTargetPresentationState(),
    createTarget("pineapple_a"),
    false,
  );
  const final = startTargetPresentation(
    first.state,
    createTarget("pineapple_b"),
    true,
  );
  const finalDone = completeTargetPresentation(
    final.state,
    final.plan.targetId,
    final.plan.token,
  );
  expectEqual("final waits for active presentation", finalDone.releaseSettlement, false);
  const firstDone = completeTargetPresentation(
    finalDone.state,
    first.plan.targetId,
    first.plan.token,
  );
  expectEqual("last active releases settlement", firstDone.releaseSettlement, true);
  expectEqual("settlement flag clears", firstDone.state.settlementPending, false);
}

function checkStaleCompletion() {
  const start = startTargetPresentation(
    createTargetPresentationState(),
    createTarget("puppy_a"),
    false,
  );
  const stale = completeTargetPresentation(
    start.state,
    start.plan.targetId,
    start.plan.token + 1,
  );
  expectEqual("stale completion rejected", stale.completed, false);
  expectEqual("stale active retained", stale.state.activeByTargetId.size, 1);
}

function checkCancellation() {
  const start = startTargetPresentation(
    createTargetPresentationState(),
    createTarget("gem_a"),
    true,
  );
  const cancelled = cancelTargetPresentations(start.state);
  expectEqual("cancel clears active", cancelled.activeByTargetId.size, 0);
  expectEqual("cancel clears barrier", cancelled.settlementPending, false);
  expectEqual("cancel advances generation", cancelled.generation, 1);
  const late = completeTargetPresentation(
    cancelled,
    start.plan.targetId,
    start.plan.token,
  );
  expectEqual("cancel rejects late completion", late.completed, false);
}

function createTarget(targetId, triggerBehavior = "tapToFind") {
  return {
    targetId,
    typeId: targetId.split("_")[0],
    mapId: "fixture_map",
    position: { x: 800, y: 1200 },
    hitShape: { type: "circle", radius: 40 },
    difficulty: 1,
    visibilityRule: "visible",
    triggerBehavior,
    feedbackPresetId: "find_success",
    reward: { score: 100 },
    tags: [],
  };
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, received ${actual}`);
  }
}
