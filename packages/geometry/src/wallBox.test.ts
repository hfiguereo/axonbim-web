import { describe, expect, it } from "vitest";
import type { Wall } from "@axonbim/model";
import { EPS_LENGTH, almostEqual } from "@axonbim/shared";
import { computeWallJoinDirs, miterCorners, wallBoxMesh, wallMetrics } from "../src/index";

const wall: Wall = {
  id: "wall.test",
  storeyId: "storey.1",
  familyId: "family.block-150",
  p1: { x: 0, y: 0, z: 0 },
  p2: { x: 4, y: 0, z: 0 },
  height: 2.7,
  thickness: 0.15,
};

describe("wallBoxMesh", () => {
  it("matches length, volume, centroid, bbox oracles", () => {
    const m = wallMetrics(wall);
    expect(almostEqual(m.length, 4)).toBe(true);
    expect(almostEqual(m.volume, 4 * 0.15 * 2.7, 1e-9)).toBe(true);
    expect(almostEqual(m.centroidXY.x, 2)).toBe(true);
    expect(almostEqual(m.centroidXY.y, 0)).toBe(true);
    expect(almostEqual(m.bbox.min.x, 0)).toBe(true);
    expect(almostEqual(m.bbox.max.x, 4)).toBe(true);
    expect(almostEqual(m.bbox.min.y, -0.075)).toBe(true);
    expect(almostEqual(m.bbox.max.y, 0.075)).toBe(true);
    expect(almostEqual(m.bbox.min.z, 0)).toBe(true);
    expect(almostEqual(m.bbox.max.z, 2.7)).toBe(true);
  });

  it("emits a closed prism mesh", () => {
    const mesh = wallBoxMesh(wall);
    expect(mesh.positions.length).toBe(6 * 4 * 3);
    expect(mesh.indices.length).toBe(6 * 6);
  });

  it("returns empty mesh for degenerate wall", () => {
    const mesh = wallBoxMesh({ ...wall, p2: { ...wall.p1 } });
    expect(mesh.positions.length).toBe(0);
  });

  it("miters L-joins cleanly (outer corner, no slab overlap)", () => {
    const a: Wall = {
      ...wall,
      id: "wall.a",
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 4, y: 0, z: 0 },
    };
    const b: Wall = {
      ...wall,
      id: "wall.b",
      p1: { x: 4, y: 0, z: 0 },
      p2: { x: 4, y: 3, z: 0 },
    };
    const joins = computeWallJoinDirs([a, b]);
    expect(joins.get("wall.a")?.endAway?.x).toBeCloseTo(0, 8);
    expect(joins.get("wall.a")?.endAway?.y).toBeCloseTo(1, 8);
    expect(joins.get("wall.b")?.startAway?.x).toBeCloseTo(-1, 8);
    expect(joins.get("wall.b")?.startAway?.y).toBeCloseTo(0, 8);

    const half = 0.075;
    const m = miterCorners({ x: 4, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, half);
    // Outer corner at 90° miter
    expect(m.right.x).toBeCloseTo(4 + half, 5);
    expect(m.right.y).toBeCloseTo(-half, 5);
    // Inner corner
    expect(m.left.x).toBeCloseTo(4 - half, 5);
    expect(m.left.y).toBeCloseTo(half, 5);

    const meshA = wallBoxMesh(a, { joinEndAway: joins.get("wall.a")!.endAway });
    const meshB = wallBoxMesh(b, { joinStartAway: joins.get("wall.b")!.startAway });

    // Both meshes share the same outer miter tip (within eps)
    const tipA = m.right;
    let nearA = false;
    let nearB = false;
    for (let i = 0; i < meshA.positions.length; i += 3) {
      if (
        Math.abs(meshA.positions[i]! - tipA.x) < 1e-5 &&
        Math.abs(meshA.positions[i + 1]! - tipA.y) < 1e-5
      ) {
        nearA = true;
      }
    }
    for (let i = 0; i < meshB.positions.length; i += 3) {
      if (
        Math.abs(meshB.positions[i]! - tipA.x) < 1e-5 &&
        Math.abs(meshB.positions[i + 1]! - tipA.y) < 1e-5
      ) {
        nearB = true;
      }
    }
    expect(nearA).toBe(true);
    expect(nearB).toBe(true);

    // No crude axis extension past outer tip along +X for A alone beyond miter tip
    let maxX = -Infinity;
    for (let i = 0; i < meshA.positions.length; i += 3) {
      maxX = Math.max(maxX, meshA.positions[i]!);
    }
    expect(maxX).toBeCloseTo(4 + half, 4);
  });
});
