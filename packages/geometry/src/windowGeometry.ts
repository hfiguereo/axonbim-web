import type { Wall, Window } from "@axonbim/model";
import { DOOR_LEAF_ANGLE_RAD, wallMaxHeightOf } from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { PlanFlipControl } from "./planControls";
import type { MeshBuffer } from "./types";
import { emptyMesh } from "./wallBox";

export type { PlanFlipControl } from "./planControls";

type Acc = { positions: number[]; normals: number[]; indices: number[] };
type V = { x: number; y: number; z: number };

export const WINDOW_JAMB_W = 0.04;
export const WINDOW_HEAD_H = 0.045;
export const WINDOW_SILL_H = 0.05;
export const WINDOW_LEAF_GAP = 0.005;

export type WindowMeshes = {
  frame: MeshBuffer;
  sash: MeshBuffer;
  glass: MeshBuffer;
};

export type WindowPlanSymbol = {
  lines: Float32Array;
  flipControls: PlanFlipControl[];
};

function finish(acc: Acc): MeshBuffer {
  if (acc.positions.length === 0) return emptyMesh();
  return {
    positions: new Float32Array(acc.positions),
    normals: new Float32Array(acc.normals),
    indices: new Uint32Array(acc.indices),
  };
}

function appendFace(acc: Acc, a: V, b: V, c: V, d: V, n: V): void {
  const base = acc.positions.length / 3;
  for (const v of [a, b, c, d]) {
    acc.positions.push(v.x, v.y, v.z);
    acc.normals.push(n.x, n.y, n.z);
  }
  acc.indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
}

function appendBox(
  acc: Acc,
  ox: number,
  oy: number,
  ux: number,
  uy: number,
  vx: number,
  vy: number,
  u0: number,
  u1: number,
  v0: number,
  v1: number,
  z0: number,
  z1: number,
): void {
  if (u1 - u0 < 1e-6 || v1 - v0 < 1e-6 || z1 - z0 < 1e-6) return;
  const c = (u: number, v: number, z: number): V => ({
    x: ox + ux * u + vx * v,
    y: oy + uy * u + vy * v,
    z,
  });
  const b00 = c(u0, v0, z0);
  const b10 = c(u1, v0, z0);
  const b11 = c(u1, v1, z0);
  const b01 = c(u0, v1, z0);
  const t00 = c(u0, v0, z1);
  const t10 = c(u1, v0, z1);
  const t11 = c(u1, v1, z1);
  const t01 = c(u0, v1, z1);
  appendFace(acc, b00, b10, b11, b01, { x: 0, y: 0, z: -1 });
  appendFace(acc, t00, t01, t11, t10, { x: 0, y: 0, z: 1 });
  appendFace(acc, b00, b01, t01, t00, { x: -ux, y: -uy, z: 0 });
  appendFace(acc, b10, t10, t11, b11, { x: ux, y: uy, z: 0 });
  appendFace(acc, b00, t00, t10, b10, { x: -vx, y: -vy, z: 0 });
  appendFace(acc, b01, b11, t11, t01, { x: vx, y: vy, z: 0 });
}

type WindowBasis = {
  ux: number;
  uy: number;
  nx: number;
  ny: number;
  hx: number;
  hy: number;
  lx: number;
  ly: number;
  leafLen: number;
  leafT: number;
  z0: number;
  z1: number;
  baseZ: number;
  swingSign: number;
  closedAlong: number;
};

function windowBasis(wall: Wall, win: Window): WindowBasis | null {
  const dx = wall.p2.x - wall.p1.x;
  const dy = wall.p2.y - wall.p1.y;
  const length = Math.hypot(dx, dy);
  if (length < MIN_WALL_LENGTH) return null;
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy;
  const ny = ux;
  const baseZ = Math.min(wall.p1.z, wall.p2.z);
  const openLeft = win.centerOffset - win.width / 2;
  const openRight = win.centerOffset + win.width / 2;
  const clearLeft = openLeft + WINDOW_JAMB_W;
  const clearRight = openRight - WINDOW_JAMB_W;
  const clearW = Math.max(0.15, clearRight - clearLeft - WINDOW_LEAF_GAP);
  const leafT = Math.min(0.035, wall.thickness * 0.28);
  const hingeSign = win.hinge === "start" ? -1 : 1;
  const closedAlong = -hingeSign;
  const swingSign = (win.swing ?? "positive") === "negative" ? -1 : 1;
  const hingeAlong =
    win.hinge === "start" ? clearLeft + WINDOW_LEAF_GAP * 0.5 : clearRight - WINDOW_LEAF_GAP * 0.5;
  const open = DOOR_LEAF_ANGLE_RAD[win.leafState ?? "closed"];
  const cos = Math.cos(open);
  const sin = Math.sin(open);
  const lx = ux * closedAlong * cos + nx * swingSign * sin;
  const ly = uy * closedAlong * cos + ny * swingSign * sin;
  const hx = wall.p1.x + ux * hingeAlong;
  const hy = wall.p1.y + uy * hingeAlong;
  const z0 = baseZ + win.sill + WINDOW_SILL_H + WINDOW_LEAF_GAP;
  const z1 = baseZ + win.sill + win.height - WINDOW_HEAD_H - WINDOW_LEAF_GAP;
  return {
    ux,
    uy,
    nx,
    ny,
    hx,
    hy,
    lx,
    ly,
    leafLen: clearW,
    leafT,
    z0,
    z1,
    baseZ,
    swingSign,
    closedAlong,
  };
}

/**
 * Window: full frame (jambs + head + sill), sash rails, glass pane.
 * Default leaf closed in the plane of the wall.
 */
export function windowAssemblyMeshes(wall: Wall, win: Window): WindowMeshes {
  const b = windowBasis(wall, win);
  if (!b) {
    return { frame: emptyMesh(), sash: emptyMesh(), glass: emptyMesh() };
  }
  const { ux, uy, nx, ny, hx, hy, lx, ly, leafLen, leafT, z0, z1, baseZ } = b;
  const frameAcc: Acc = { positions: [], normals: [], indices: [] };
  const sashAcc: Acc = { positions: [], normals: [], indices: [] };
  const glassAcc: Acc = { positions: [], normals: [], indices: [] };

  const openLeft = win.centerOffset - win.width / 2;
  const openRight = win.centerOffset + win.width / 2;
  const clearLeft = openLeft + WINDOW_JAMB_W;
  const clearRight = openRight - WINDOW_JAMB_W;
  const frameDepth = Math.max(0.07, Math.min(wall.thickness * 0.95, wall.thickness - 0.005));
  const halfT = frameDepth / 2;
  const ox = wall.p1.x;
  const oy = wall.p1.y;
  const zSill = baseZ + win.sill;
  const zHead = zSill + win.height;
  const zAboveSill = zSill + WINDOW_SILL_H;
  const zUnderHead = zHead - WINDOW_HEAD_H;

  // Full lining: jambs + head + sill (windows have bottom frame)
  appendBox(frameAcc, ox, oy, ux, uy, nx, ny, openLeft, clearLeft, -halfT, halfT, zSill, zHead);
  appendBox(frameAcc, ox, oy, ux, uy, nx, ny, clearRight, openRight, -halfT, halfT, zSill, zHead);
  appendBox(frameAcc, ox, oy, ux, uy, nx, ny, openLeft, openRight, -halfT, halfT, zUnderHead, zHead);
  appendBox(frameAcc, ox, oy, ux, uy, nx, ny, openLeft, openRight, -halfT, halfT, zSill, zAboveSill);

  const ht = leafT / 2;
  const stile = Math.min(0.045, leafLen * 0.1);
  const rail = 0.045;

  // Sash frame (hollow look via perimeter rails)
  appendBox(sashAcc, hx, hy, lx, ly, -ly, lx, 0, leafLen, -ht, ht, z0, z0 + rail);
  appendBox(sashAcc, hx, hy, lx, ly, -ly, lx, 0, leafLen, -ht, ht, z1 - rail, z1);
  appendBox(sashAcc, hx, hy, lx, ly, -ly, lx, 0, stile, -ht, ht, z0 + rail, z1 - rail);
  appendBox(sashAcc, hx, hy, lx, ly, -ly, lx, leafLen - stile, leafLen, -ht, ht, z0 + rail, z1 - rail);
  // Mid mullion if wide
  if (leafLen > 0.7) {
    const mid = leafLen * 0.5;
    appendBox(sashAcc, hx, hy, lx, ly, -ly, lx, mid - stile * 0.4, mid + stile * 0.4, -ht, ht, z0 + rail, z1 - rail);
  }

  // Glass inset in sash
  const gT = 0.006;
  appendBox(
    glassAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    stile,
    leafLen - stile,
    -gT,
    gT,
    z0 + rail,
    z1 - rail,
  );

  // Simple latch on latch stile
  const handleU = leafLen - 0.04;
  const handleZ = z0 + (z1 - z0) * 0.5;
  appendBox(
    sashAcc,
    hx,
    hy,
    lx,
    ly,
    -ly,
    lx,
    handleU - 0.02,
    handleU + 0.02,
    ht,
    ht + 0.02,
    handleZ - 0.015,
    handleZ + 0.015,
  );

  return {
    frame: finish(frameAcc),
    sash: finish(sashAcc),
    glass: finish(glassAcc),
  };
}

/** Plan: wall-thickness ticks + leaf + swing arc when not closed. */
export function windowPlanSymbol(wall: Wall, win: Window): WindowPlanSymbol | null {
  const b = windowBasis(wall, win);
  if (!b) return null;
  const { ux, uy, nx, ny, hx, hy, swingSign, closedAlong, leafLen } = b;
  const z = b.baseZ + Math.max(wallMaxHeightOf(wall), win.sill + win.height) + 0.12;
  const lines: number[] = [];
  const halfT = wall.thickness / 2;
  const openLeft = win.centerOffset - win.width / 2;
  const openRight = win.centerOffset + win.width / 2;
  const ox = wall.p1.x;
  const oy = wall.p1.y;

  // Classic plan: lines across wall thickness at both jambs + mid glass line
  for (const along of [openLeft, openRight, win.centerOffset]) {
    const cx = ox + ux * along;
    const cy = oy + uy * along;
    lines.push(
      cx - nx * halfT,
      cy - ny * halfT,
      z,
      cx + nx * halfT,
      cy + ny * halfT,
      z,
    );
  }

  // Leaf edge
  const tipX = hx + b.lx * leafLen;
  const tipY = hy + b.ly * leafLen;
  lines.push(hx, hy, z, tipX, tipY, z);

  // Swing arc (casement)
  const R = leafLen;
  const steps = 12;
  let prevX = hx + ux * closedAlong * R;
  let prevY = hy + uy * closedAlong * R;
  for (let i = 1; i <= steps; i++) {
    const ang = (Math.PI / 2) * (i / steps);
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const dx = ux * closedAlong * c + nx * swingSign * s;
    const dy = uy * closedAlong * c + ny * swingSign * s;
    const x = hx + dx * R;
    const y = hy + dy * R;
    lines.push(prevX, prevY, z, x, y, z);
    prevX = x;
    prevY = y;
  }

  const midAng = Math.PI / 4;
  const mc = Math.cos(midAng);
  const ms = Math.sin(midAng);
  const midDx = ux * closedAlong * mc + nx * swingSign * ms;
  const midDy = uy * closedAlong * mc + ny * swingSign * ms;

  const flipControls: PlanFlipControl[] = [
    {
      entityType: "window",
      entityId: win.id,
      kind: "swing",
      x: hx + midDx * R * 0.72,
      y: hy + midDy * R * 0.72,
      z,
      hitRadius: 0.12,
    },
    {
      entityType: "window",
      entityId: win.id,
      kind: "hinge",
      x: hx - ux * closedAlong * 0.15 + nx * swingSign * 0.1,
      y: hy - uy * closedAlong * 0.15 + ny * swingSign * 0.1,
      z,
      hitRadius: 0.11,
    },
  ];

  return { lines: new Float32Array(lines), flipControls };
}
