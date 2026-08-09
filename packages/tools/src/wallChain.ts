/**
 * LR1-B — Restart Chain (interaction only).
 * Never mutates AxonDocument or history.
 */
import type { Vec3 } from "@axonbim/shared";
import { clearSnapSession, type SnapKind, type SnapSession } from "./snap";

export type WallChainDrawState = {
  wallPending: Vec3 | null;
  wallChainOrigin: Vec3 | null;
  wallHover: Vec3 | null;
  wallChain: boolean;
  snapSession: SnapSession;
  lastSnapKind: SnapKind;
};

/**
 * Begin a new chained run at `point` without leaving the wall tool.
 * Clears the incomplete segment; sets pending + chain origin to `point`.
 */
export function restartChainAt(point: Vec3): WallChainDrawState {
  const p = { x: point.x, y: point.y, z: point.z };
  return {
    wallChain: true,
    wallPending: p,
    wallChainOrigin: p,
    wallHover: p,
    snapSession: clearSnapSession(),
    lastSnapKind: "none",
  };
}
