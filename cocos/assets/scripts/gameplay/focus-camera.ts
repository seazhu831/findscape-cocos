import type { Vector2Config } from "../config/gameplay-schema";
import {
  clampViewportCenter,
  clampZoom,
  panViewport,
  type ViewportState,
} from "./map-viewport.ts";

export type FocusCameraPhase = "idle" | "focusing" | "focused" | "restoring";

export interface FocusCameraState {
  viewport: ViewportState;
  phase: FocusCameraPhase;
  restoreViewport?: ViewportState;
  transitionToken: number;
}

export interface FocusCameraTransition {
  kind: "focus" | "restore";
  token: number;
  from: ViewportState;
  to: ViewportState;
}

export interface FocusCameraUpdate {
  state: FocusCameraState;
  transition?: FocusCameraTransition;
}

export function createFocusCameraState(
  viewport: ViewportState,
): FocusCameraState {
  const zoom = clampZoom(viewport.zoom, viewport.minZoom, viewport.maxZoom);
  const clampedViewport = {
    ...viewport,
    zoom,
  };
  return {
    viewport: {
      ...clampedViewport,
      center: clampViewportCenter(clampedViewport, viewport.center),
    },
    phase: "idle",
    transitionToken: 0,
  };
}

export function panFocusCamera(
  state: FocusCameraState,
  screenDelta: Vector2Config,
): FocusCameraUpdate {
  if (state.phase !== "idle") {
    return { state };
  }
  return {
    state: {
      ...state,
      viewport: panViewport(state.viewport, screenDelta),
    },
  };
}

export function beginCameraFocus(
  state: FocusCameraState,
  zoomMultiplier: number,
): FocusCameraUpdate {
  if (state.phase !== "idle") {
    return { state };
  }
  const zoom = clampZoom(
    state.viewport.zoom * Math.max(1, zoomMultiplier),
    state.viewport.minZoom,
    state.viewport.maxZoom,
  );
  const focusedViewport = {
    ...state.viewport,
    zoom,
  };
  focusedViewport.center = clampViewportCenter(
    focusedViewport,
    state.viewport.center,
  );
  const token = state.transitionToken + 1;
  return {
    state: {
      viewport: focusedViewport,
      phase: "focusing",
      restoreViewport: state.viewport,
      transitionToken: token,
    },
    transition: {
      kind: "focus",
      token,
      from: state.viewport,
      to: focusedViewport,
    },
  };
}

export function completeCameraTransition(
  state: FocusCameraState,
  token: number,
): FocusCameraState {
  if (token !== state.transitionToken) {
    return state;
  }
  if (state.phase === "focusing") {
    return { ...state, phase: "focused" };
  }
  if (state.phase === "restoring") {
    return {
      ...state,
      phase: "idle",
      restoreViewport: undefined,
    };
  }
  return state;
}

export function beginCameraRestore(
  state: FocusCameraState,
): FocusCameraUpdate {
  if (state.phase !== "focused" || !state.restoreViewport) {
    return { state };
  }
  const token = state.transitionToken + 1;
  return {
    state: {
      ...state,
      viewport: state.restoreViewport,
      phase: "restoring",
      transitionToken: token,
    },
    transition: {
      kind: "restore",
      token,
      from: state.viewport,
      to: state.restoreViewport,
    },
  };
}

export function cancelCameraFocus(
  state: FocusCameraState,
): FocusCameraState {
  return {
    viewport: state.restoreViewport ?? state.viewport,
    phase: "idle",
    transitionToken: state.transitionToken + 1,
  };
}
