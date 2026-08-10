import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { SketchPoint } from "./sketchRect.js";

/** Default tessellation segments for arc → polyline (SK-draw). */
export const ARC_SEGMENTS = 12;

type XY = { x: number; y: number };

function circleThroughThree(a: XY, b: XY, c: XY): { cx: number; cy: number; r: number } | null {
  const d =
    2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(d) < 1e-12) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / d;
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / d;
  const r = Math.hypot(a.x - cx, a.y - cy);
  if (r < MIN_WALL_LENGTH) return null;
  return { cx, cy, r };
}

function normalizeAngle(a: number): number {
  let x = a;
  while (x <= -Math.PI) x += Math.PI * 2;
  while (x > Math.PI) x -= Math.PI * 2;
  return x;
}

/** Sample arc from angle0 to angle1 (inclusive endpoints), CCW if delta > 0. */
function sampleAngles(
  cx: number,
  cy: number,
  r: number,
  z: number,
  angle0: number,
  angle1: number,
  segments: number,
): SketchPoint[] {
  const pts: SketchPoint[] = [];
  const n = Math.max(2, segments);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const ang = angle0 + (angle1 - angle0) * t;
    pts.push({
      x: cx + r * Math.cos(ang),
      y: cy + r * Math.sin(ang),
      z,
    });
  }
  return pts;
}

/**
 * Arc by start → end → point on arc (SER).
 * Empty if colinear / radius too small / through not usable.
 */
export function sampleArcSER(
  start: SketchPoint,
  end: SketchPoint,
  through: SketchPoint,
  segments: number = ARC_SEGMENTS,
): SketchPoint[] {
  const chord = Math.hypot(end.x - start.x, end.y - start.y);
  if (chord < MIN_WALL_LENGTH) return [];
  const circ = circleThroughThree(start, end, through);
  if (!circ) return [];
  const { cx, cy, r } = circ;
  const a0 = Math.atan2(start.y - cy, start.x - cx);
  const a1 = Math.atan2(end.y - cy, end.x - cx);
  const aT = Math.atan2(through.y - cy, through.x - cx);

  // Choose direction so `through` lies on the sampled arc.
  let deltaCCW = normalizeAngle(a1 - a0);
  if (deltaCCW < 0) deltaCCW += Math.PI * 2;
  let tFrom0 = normalizeAngle(aT - a0);
  if (tFrom0 < 0) tFrom0 += Math.PI * 2;
  const throughOnCcw = tFrom0 <= deltaCCW + 1e-9;

  const angleStart = a0;
  const angleEnd = a0 + (throughOnCcw ? deltaCCW : deltaCCW - Math.PI * 2);
  if (Math.abs(angleEnd - angleStart) < 1e-9) return [];

  return sampleAngles(cx, cy, r, start.z, angleStart, angleEnd, segments);
}

/**
 * Arc by center → start (radius) → end (sweep, minor arc).
 */
export function sampleArcCE(
  center: SketchPoint,
  start: SketchPoint,
  end: SketchPoint,
  segments: number = ARC_SEGMENTS,
): SketchPoint[] {
  const r = Math.hypot(start.x - center.x, start.y - center.y);
  const rEnd = Math.hypot(end.x - center.x, end.y - center.y);
  if (r < MIN_WALL_LENGTH) return [];
  // Project end onto the circle of radius r (angle from end direction).
  if (rEnd < 1e-12) return [];
  const a0 = Math.atan2(start.y - center.y, start.x - center.x);
  const a1 = Math.atan2(end.y - center.y, end.x - center.x);
  const delta = normalizeAngle(a1 - a0);
  // Minor arc: |delta| <= π
  if (Math.abs(delta) < 1e-9) return [];
  return sampleAngles(center.x, center.y, r, center.z, a0, a0 + delta, segments);
}

/** Closer endpoint of a wall axis to a world point (XY). */
export function closerEndpoint(
  wall: { p1: SketchPoint; p2: SketchPoint },
  point: SketchPoint,
): SketchPoint {
  const d1 = Math.hypot(wall.p1.x - point.x, wall.p1.y - point.y);
  const d2 = Math.hypot(wall.p2.x - point.x, wall.p2.y - point.y);
  return d1 <= d2
    ? { x: wall.p1.x, y: wall.p1.y, z: wall.p1.z }
    : { x: wall.p2.x, y: wall.p2.y, z: wall.p2.z };
}
