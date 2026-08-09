import { describe, expect, it } from "vitest";
import type { Wall } from "@axonbim/model";
import { wallMeshWithOpenings, type WallOpening } from "./openings";

function wall(): Wall {
  return {
    id: "wall.1",
    storeyId: "storey.default",
    familyId: "family.block-150",
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: 6, y: 0, z: 0 },
    height: 2.7,
    thickness: 0.15,
  };
}

describe("wallMeshWithOpenings", () => {
  it("builds a non-empty mesh for several non-overlapping openings", () => {
    const openings: WallOpening[] = [
      { centerAlong: 1.5, width: 0.9, height: 2.1, sill: 0 },
      { centerAlong: 4.5, width: 0.9, height: 1.2, sill: 0.9 },
    ];
    const mesh = wallMeshWithOpenings(wall(), openings);
    expect(mesh.positions.length).toBeGreaterThan(0);
    expect(mesh.indices.length).toBeGreaterThan(0);
  });

  it("returns a solid wall when there are no openings", () => {
    const withOpenings = wallMeshWithOpenings(wall(), []);
    expect(withOpenings.positions.length).toBeGreaterThan(0);
  });
});
