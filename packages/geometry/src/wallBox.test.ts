import { describe, expect, it } from "vitest";
import type { Wall } from "@axonbim/model";
import { EPS_LENGTH, almostEqual } from "@axonbim/shared";
import { computeWallJoinExtensions, wallBoxMesh, wallMetrics } from "../src/index";

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
    expect(mesh.normals.length).toBe(mesh.positions.length);

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      minX = Math.min(minX, mesh.positions[i]!);
      maxX = Math.max(maxX, mesh.positions[i]!);
      minY = Math.min(minY, mesh.positions[i + 1]!);
      maxY = Math.max(maxY, mesh.positions[i + 1]!);
      minZ = Math.min(minZ, mesh.positions[i + 2]!);
      maxZ = Math.max(maxZ, mesh.positions[i + 2]!);
    }
    expect(Math.abs(minX - 0) <= EPS_LENGTH).toBe(true);
    expect(Math.abs(maxX - 4) <= EPS_LENGTH).toBe(true);
    expect(Math.abs(minY - -0.075) <= EPS_LENGTH).toBe(true);
    expect(Math.abs(maxY - 0.075) <= EPS_LENGTH).toBe(true);
    expect(Math.abs(minZ - 0) <= EPS_LENGTH).toBe(true);
    expect(Math.abs(maxZ - 2.7) <= EPS_LENGTH).toBe(true);
  });

  it("returns empty mesh for degenerate wall", () => {
    const mesh = wallBoxMesh({ ...wall, p2: { ...wall.p1 } });
    expect(mesh.positions.length).toBe(0);
  });

  it("extends ends at L-joins so outer corner fills", () => {
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
    const joins = computeWallJoinExtensions([a, b]);
    expect(joins.get("wall.a")?.end).toBeCloseTo(0.075, 5);
    expect(joins.get("wall.b")?.start).toBeCloseTo(0.075, 5);
    expect(joins.get("wall.a")?.start).toBe(0);

    const meshA = wallBoxMesh(a, { extendEnd: joins.get("wall.a")!.end });
    let maxX = -Infinity;
    for (let i = 0; i < meshA.positions.length; i += 3) {
      maxX = Math.max(maxX, meshA.positions[i]!);
    }
    // parametric end at x=4; + half thickness along +X → outer corner to 4.075
    expect(maxX).toBeCloseTo(4.075, 3);
  });
});
