import type { DoorFamily, WallFamily, WindowFamily } from "@axonbim/families";
import type { Vec3 } from "@axonbim/shared";

export type ProjectMeta = {
  format: "axon";
  formatVersion: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Storey = {
  id: string;
  name: string;
  elevation: number;
};

export type Wall = {
  id: string;
  storeyId: string;
  familyId: string;
  p1: Vec3;
  p2: Vec3;
  height: number;
  thickness: number;
};

/** Door hosted on a wall — center along wall axis from p1. */
export type Door = {
  id: string;
  wallId: string;
  familyId: string;
  /** Meters along wall axis from p1 to door center. */
  centerOffset: number;
  width: number;
  height: number;
  /** Height of sill above wall base (usually 0). */
  sill: number;
  /** Hinge toward wall p1 ("start") or p2 ("end"). */
  hinge: "start" | "end";
  /**
   * Swing side relative to wall normal (+n = positive).
   * Flip in plan with the mid-arc grip.
   */
  swing: DoorSwing;
  /** Leaf representation in plan/3D. Default open = 90°. */
  leafState: DoorLeafState;
};

/** Window hosted on a wall — same hosting pattern as Door. */
export type Window = {
  id: string;
  wallId: string;
  familyId: string;
  centerOffset: number;
  width: number;
  height: number;
  /** Height of sill above wall base (typically ~0.9 m). */
  sill: number;
  hinge: "start" | "end";
  swing: DoorSwing;
  leafState: DoorLeafState;
};

export type DoorSwing = "positive" | "negative";

export type DoorLeafState = "closed" | "ajar" | "open";

export const DOOR_LEAF_ANGLE_RAD: Record<DoorLeafState, number> = {
  closed: 0,
  ajar: Math.PI / 4, // 45°
  open: Math.PI / 2, // 90°
};

export type AxonDocument = {
  meta: ProjectMeta;
  storeys: Storey[];
  families: WallFamily[];
  doorFamilies: DoorFamily[];
  windowFamilies: WindowFamily[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
};
