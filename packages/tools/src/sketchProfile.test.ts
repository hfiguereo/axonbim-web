import { describe, expect, it } from "vitest";
import {
  appendProfileEdge,
  findWallLoop,
  hitProfileVertex,
  moveProfileVertex,
  profileFromWallAxis,
  profileToPoints,
  profileVertices,
  projectProfileToWorkplaneZ,
  seedProfileFromWall,
} from "./sketchProfile.js";

const z = 0;

function wall(
  id: string,
  p1: [number, number],
  p2: [number, number],
  storeyId = "storey.1",
) {
  return {
    id,
    storeyId,
    p1: { x: p1[0], y: p1[1], z },
    p2: { x: p2[0], y: p2[1], z },
  };
}

describe("sketchProfile", () => {
  it("seeds a single wall as one open edge", () => {
    const w = wall("wall.a", [0, 0], [3, 0]);
    const p = profileFromWallAxis(w);
    expect(p.sourceWallIds).toEqual(["wall.a"]);
    expect(p.edges).toHaveLength(1);
    expect(p.closed).toBe(false);
    expect(profileToPoints(p)).toHaveLength(2);
  });

  it("finds a rectangular 4-wall loop", () => {
    const walls = [
      wall("w1", [0, 0], [4, 0]),
      wall("w2", [4, 0], [4, 3]),
      wall("w3", [4, 3], [0, 3]),
      wall("w4", [0, 3], [0, 0]),
    ];
    const loop = findWallLoop(walls, "w1");
    expect(loop?.map((w) => w.id)).toEqual(["w1", "w2", "w3", "w4"]);
    const profile = seedProfileFromWall(walls, "w2");
    expect(profile?.closed).toBe(true);
    expect(profile?.sourceWallIds).toHaveLength(4);
    expect(profile?.edges).toHaveLength(4);
    const pts = profileToPoints(profile!);
    expect(pts.length).toBeGreaterThanOrEqual(5); // closed ring
  });

  it("falls back to single wall when no loop", () => {
    const walls = [wall("w1", [0, 0], [2, 0]), wall("w2", [5, 5], [6, 5])];
    const profile = seedProfileFromWall(walls, "w1");
    expect(profile?.sourceWallIds).toEqual(["w1"]);
    expect(profile?.closed).toBe(false);
  });

  it("appends an edge to the profile", () => {
    const base = profileFromWallAxis(wall("w1", [0, 0], [2, 0]));
    const next = appendProfileEdge(
      base,
      { x: 2, y: 0, z },
      { x: 2, y: 1, z },
    );
    expect(next.edges).toHaveLength(2);
    expect(next.sourceWallIds).toEqual(["w1"]);
  });

  it("projects profile onto workplane z and moves a vertex", () => {
    const p = projectProfileToWorkplaneZ(
      profileFromWallAxis(wall("w1", [0, 0], [3, 0])),
      1.25,
    );
    expect(p.edges[0]!.p1.z).toBe(1.25);
    expect(p.edges[0]!.p2.z).toBe(1.25);
    expect(profileVertices(p)).toHaveLength(2);
    expect(hitProfileVertex(p, { x: 3, y: 0.02, z: 1.25 })).toBe(1);
    const moved = moveProfileVertex(p, 1, { x: 5, y: 0, z: 1.25 });
    expect(moved?.edges[0]!.p2.x).toBeCloseTo(5);
  });
});
