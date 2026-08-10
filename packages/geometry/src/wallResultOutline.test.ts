import { describe, expect, it } from "vitest";
import {
  workplaneFromLineTrace,
  workplaneFromStorey,
  workplaneFromWallFace,
  type Wall,
} from "@axonbim/model";
import {
  invertStoreyFootprint,
  isWallBoxFootprint,
  outlineOnWorkplane,
  wallBoxPlanCorners,
} from "./wallResultOutline.js";

const storey = { id: "storey.1", name: "N0", elevation: 0 };

function wall(
  id: string,
  p1: [number, number],
  p2: [number, number],
  thickness = 0.15,
  height = 2.7,
): Wall {
  return {
    id,
    storeyId: storey.id,
    familyId: "family.default",
    p1: { x: p1[0], y: p1[1], z: 0 },
    p2: { x: p2[0], y: p2[1], z: 0 },
    height,
    thickness,
  };
}

describe("wallResultOutline", () => {
  it("storey single wall → plan footprint ≈ length × thickness", () => {
    const w = wall("wall.a", [0, 0], [3, 0], 0.15);
    const wp = workplaneFromStorey(storey);
    const o = outlineOnWorkplane([w], w.id, wp);
    expect(o).not.toBeNull();
    expect(o!.closed).toBe(true);
    expect(o!.points).toHaveLength(4);
    const xs = o!.points.map((p) => p.x);
    const ys = o!.points.map((p) => p.y);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(3, 5);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(0.15, 5);
  });

  it("isWallBoxFootprint accepts axis-aligned box and rejects skew", () => {
    const half = 0.075;
    const box = [
      { x: 0, y: -half, z: 0 },
      { x: 3, y: -half, z: 0 },
      { x: 3, y: half, z: 0 },
      { x: 0, y: half, z: 0 },
    ];
    const skew = [
      { x: 0, y: -half, z: 0 },
      { x: 3, y: -half, z: 0 },
      { x: 4, y: half, z: 0 },
      { x: 0, y: half, z: 0 },
    ];
    expect(isWallBoxFootprint(box)).toBe(true);
    expect(isWallBoxFootprint(skew)).toBe(false);
  });

  it("invertStoreyFootprint recovers axis and thickness", () => {
    const w = wall("wall.a", [0, 0], [3, 0], 0.2);
    const corners = wallBoxPlanCorners(w)!;
    const ring = [corners[0]!, corners[3]!, corners[2]!, corners[1]!];
    const inv = invertStoreyFootprint(ring);
    expect(inv).not.toBeNull();
    expect(inv!.thickness).toBeCloseTo(0.2, 5);
    expect(inv!.p1.x).toBeCloseTo(0, 4);
    expect(inv!.p2.x).toBeCloseTo(3, 4);
    expect(inv!.p1.y).toBeCloseTo(0, 4);
    expect(inv!.p2.y).toBeCloseTo(0, 4);
  });

  it("surface face outline is length × height on the face plane", () => {
    const w = wall("wall.a", [0, 0], [4, 0], 0.15, 2.5);
    const face = workplaneFromWallFace(w, "front")!;
    const o = outlineOnWorkplane([w], w.id, face);
    expect(o).not.toBeNull();
    expect(o!.points).toHaveLength(4);
    // All points near the face plane (project ≈ identity)
    for (const p of o!.points) {
      const dist =
        (p.x - face.origin.x) * face.normal.x +
        (p.y - face.origin.y) * face.normal.y +
        (p.z - face.origin.z) * face.normal.z;
      expect(Math.abs(dist)).toBeLessThan(1e-6);
    }
    const zs = o!.points.map((p) => p.z);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(2.5, 5);
  });

  it("closed 4-wall loop → outer ring of 4 points (not centerline)", () => {
    const walls = [
      wall("w0", [0, 0], [4, 0]),
      wall("w1", [4, 0], [4, 3]),
      wall("w2", [4, 3], [0, 3]),
      wall("w3", [0, 3], [0, 0]),
    ];
    const wp = workplaneFromStorey(storey);
    const o = outlineOnWorkplane(walls, "w0", wp);
    expect(o).not.toBeNull();
    expect(o!.closed).toBe(true);
    expect(o!.points).toHaveLength(4);
    expect(o!.sourceWallIds).toHaveLength(4);
    const xs = o!.points.map((p) => p.x);
    const ys = o!.points.map((p) => p.y);
    // Outer = room 4×3 expanded by half thickness 0.075
    expect(Math.min(...xs)).toBeCloseTo(-0.075, 3);
    expect(Math.max(...xs)).toBeCloseTo(4.075, 3);
    expect(Math.min(...ys)).toBeCloseTo(-0.075, 3);
    expect(Math.max(...ys)).toBeCloseTo(3.075, 3);
  });

  it("line workplane → closed silhouette with ≥3 points", () => {
    const w = wall("wall.a", [0, 0], [3, 0]);
    const wp = workplaneFromLineTrace(
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      storey.id,
      0,
    )!;
    const o = outlineOnWorkplane([w], w.id, wp);
    expect(o).not.toBeNull();
    expect(o!.closed).toBe(true);
    expect(o!.points.length).toBeGreaterThanOrEqual(3);
  });
});
