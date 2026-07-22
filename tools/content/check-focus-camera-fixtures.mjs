import {
  beginCameraFocus,
  beginCameraRestore,
  cancelCameraFocus,
  completeCameraTransition,
  createFocusCameraState,
  panFocusCamera,
} from "../../cocos/assets/scripts/gameplay/focus-camera.ts";

const failures = [];

checkFocusKeepsCurrentRegion();
checkFocusClampsNearMapEdge();
checkFocusedCameraRejectsPan();
checkRestoreRoundTrip();
checkCancellationInvalidatesLateCompletion();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Validated 5 focus camera fixture groups");

function checkFocusKeepsCurrentRegion() {
  const initial = createState({ x: 1000, y: 1400 });
  const update = beginCameraFocus(initial, 1.5);
  expectEqual("focus phase", update.state.phase, "focusing");
  expectEqual("focus zoom", update.state.viewport.zoom, 1.5);
  expectPoint("focus center", update.state.viewport.center, { x: 1000, y: 1400 });
  expectPoint("focus transition from", update.transition?.from.center, {
    x: 1000,
    y: 1400,
  });
}

function checkFocusClampsNearMapEdge() {
  const initial = createState({ x: 540, y: 960 });
  const panned = panFocusCamera(initial, { x: 1000, y: 1000 }).state;
  expectPoint("pan clamped center", panned.viewport.center, { x: 540, y: 960 });
  const update = beginCameraFocus(panned, 10);
  expectEqual("focus max zoom", update.state.viewport.zoom, 2);
  expectPoint("focused edge remains valid", update.state.viewport.center, {
    x: 540,
    y: 960,
  });
}

function checkFocusedCameraRejectsPan() {
  const focusing = beginCameraFocus(createState({ x: 900, y: 1300 }), 1.5);
  const focused = completeCameraTransition(
    focusing.state,
    focusing.transition.token,
  );
  const panned = panFocusCamera(focused, { x: 100, y: -50 });
  expectPoint("focused pan ignored", panned.state.viewport.center, {
    x: 900,
    y: 1300,
  });
}

function checkRestoreRoundTrip() {
  const initial = createState({ x: 980, y: 1420 });
  const focus = beginCameraFocus(initial, 1.5);
  const focused = completeCameraTransition(focus.state, focus.transition.token);
  const restore = beginCameraRestore(focused);
  expectEqual("restore phase", restore.state.phase, "restoring");
  expectPoint("restore center", restore.state.viewport.center, {
    x: 980,
    y: 1420,
  });
  expectEqual("restore zoom", restore.state.viewport.zoom, 1);
  const idle = completeCameraTransition(
    restore.state,
    restore.transition.token,
  );
  expectEqual("restored phase", idle.phase, "idle");
  expectEqual("restore snapshot cleared", idle.restoreViewport, undefined);
}

function checkCancellationInvalidatesLateCompletion() {
  const focus = beginCameraFocus(createState({ x: 800, y: 1200 }), 1.5);
  const cancelled = cancelCameraFocus(focus.state);
  const afterLateCompletion = completeCameraTransition(
    cancelled,
    focus.transition.token,
  );
  expectEqual("cancelled phase", afterLateCompletion.phase, "idle");
  expectEqual("cancelled zoom", afterLateCompletion.viewport.zoom, 1);
  expectEqual(
    "cancel token advanced",
    afterLateCompletion.transitionToken,
    focus.transition.token + 1,
  );
}

function createState(center) {
  return createFocusCameraState({
    viewSize: { width: 1080, height: 1920 },
    mapSize: { width: 1600, height: 2400 },
    center,
    zoom: 1,
    minZoom: 1,
    maxZoom: 2,
  });
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    failures.push(`${label}: expected ${expected}, received ${actual}`);
  }
}

function expectPoint(label, actual, expected) {
  if (!actual || actual.x !== expected.x || actual.y !== expected.y) {
    failures.push(
      `${label}: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}
