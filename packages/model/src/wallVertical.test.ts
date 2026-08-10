import { describe, expect, it } from "vitest";
import type { Wall } from "./types.js";
import {
  openingRectangleUV,
  pointInWallProfile,
  validateOpeningInsideWallProfile,
  validateWallProfile,
  validateWallVerticalDefinition,
  wallAxisFrame,
  wallLength,
  wallLocalToWorld,
  wallMaxHeight,
  wallVerticalFromHeight,
  wallVerticalLoop,
  wallVerticalOf,
  worldToWallProfileUV,
} from "./wallVertical.js";

const wall: Wall = {
  id: "wall.1",
  storeyId: "s1",
  familyId: "family.block-150",
  p1: { x: 0, y: 0, z: 0 },
  p2: { x: 4, y: 0, z: 0 },
  thickness: 0.15,
  vertical: { kind: "uniform", height: 2.7 },
};

describe("wallVertical helpers", () => {
  it("wallLength and frame match axis", () => {
    expect(wallLength(wall)).toBeCloseTo(4, 6);
    const f = wallAxisFrame(wall)!;
    expect(f.ux).toBeCloseTo(1, 6);
    expect(f.uy).toBeCloseTo(0, 6);
    expect(f.nx).toBeCloseTo(0, 6);
    expect(f.ny).toBeCloseTo(1, 6);
    expect(f.baseZ).toBe(0);
  });

  it("uniform loop is the implicit rectangle", () => {
    const loop = wallVerticalLoop(wallVerticalOf(wall), 4);
    expect(loop).toEqual([
      { u: 0, v: 0 },
      { u: 4, v: 0 },
      { u: 4, v: 2.7 },
      { u: 0, v: 2.7 },
    ]);
    expect(wallMaxHeight(wallVerticalFromHeight(2.7))).toBe(2.7);
  });

  it("local ↔ world round-trip on face", () => {
    const w = wallLocalToWorld(wall, { u: 2, v: 1.5, n: 0.075 })!;
    expect(w.x).toBeCloseTo(2, 6);
    expect(w.y).toBeCloseTo(0.075, 6);
    expect(w.z).toBeCloseTo(1.5, 6);
    const uv = worldToWallProfileUV(wall, w)!;
    expect(uv.u).toBeCloseTo(2, 6);
    expect(uv.v).toBeCloseTo(1.5, 6);
  });
});

describe("validateWallProfile", () => {
  it("accepts a rectangular uniform-equivalent loop", () => {
    const loop = wallVerticalLoop({ kind: "uniform", height: 3 }, 4);
    expect(validateWallProfile(loop, 4)).toBeNull();
    expect(validateWallVerticalDefinition({ kind: "uniform", height: 3 }, 4)).toBeNull();
  });

  it("accepts a sloped top (case B)", () => {
    const loop = [
      { u: 0, v: 0 },
      { u: 4, v: 0 },
      { u: 4, v: 2 },
      { u: 0, v: 3 },
    ];
    expect(validateWallProfile(loop, 4)).toBeNull();
    expect(wallMaxHeight({ kind: "profile", outerLoop: loop })).toBe(3);
  });

  it("accepts a stepped top (case C)", () => {
    const loop = [
      { u: 0, v: 0 },
      { u: 4, v: 0 },
      { u: 4, v: 2 },
      { u: 2, v: 2 },
      { u: 2, v: 3 },
      { u: 0, v: 3 },
    ];
    expect(validateWallProfile(loop, 4)).toBeNull();
  });

  it("rejects self-intersection", () => {
    const loop = [
      { u: 0, v: 0 },
      { u: 4, v: 0 },
      { u: 0, v: 3 },
      { u: 4, v: 3 },
    ];
    const r = validateWallProfile(loop, 4);
    expect(r?.code).toBe("profile.selfIntersection");
  });

  it("rejects short edges and missing ends", () => {
    expect(
      validateWallProfile(
        [
          { u: 0, v: 0 },
          { u: 0.01, v: 0 },
          { u: 0.01, v: 1 },
          { u: 0, v: 1 },
        ],
        4,
      )?.code,
    ).toMatch(/edge\.short|ends/);
    expect(
      validateWallProfile(
        [
          { u: 0.2, v: 0 },
          { u: 3.8, v: 0 },
          { u: 3.8, v: 2 },
          { u: 0.2, v: 2 },
        ],
        4,
      )?.code,
    ).toBe("profile.ends");
  });

  it("rejects u out of bounds and v below base", () => {
    expect(
      validateWallProfile(
        [
          { u: -0.2, v: 0 },
          { u: 4, v: 0 },
          { u: 4, v: 2 },
          { u: 0, v: 2 },
        ],
        4,
      )?.code,
    ).toBe("profile.u.bounds");
    expect(
      validateWallProfile(
        [
          { u: 0, v: -0.2 },
          { u: 4, v: 0 },
          { u: 4, v: 2 },
          { u: 0, v: 2 },
        ],
        4,
      )?.code,
    ).toBe("profile.v.belowBase");
  });
});

describe("openings inside profile", () => {
  it("accepts a door inside a uniform wall", () => {
    const opening = {
      id: "door.1",
      wallId: "wall.1",
      centerOffset: 2,
      width: 0.9,
      height: 2.1,
      sill: 0,
    };
    expect(
      validateOpeningInsideWallProfile(opening, wall, wallVerticalOf(wall)),
    ).toBeNull();
    const corners = openingRectangleUV(opening);
    const loop = wallVerticalLoop(wallVerticalOf(wall), 4);
    for (const c of corners) expect(pointInWallProfile(c, loop)).toBe(true);
  });

  it("rejects an opening that leaves a stepped profile", () => {
    const stepped = {
      kind: "profile" as const,
      outerLoop: [
        { u: 0, v: 0 },
        { u: 4, v: 0 },
        { u: 4, v: 1.5 },
        { u: 2, v: 1.5 },
        { u: 2, v: 2.7 },
        { u: 0, v: 2.7 },
      ],
    };
    const highWindow = {
      id: "win.1",
      wallId: "wall.1",
      centerOffset: 3.2,
      width: 1.0,
      height: 1.2,
      sill: 1.0,
    };
    // Top-right of window around u≈3.7, v≈2.2 — outside the step (v max 1.5 for u>2).
    const r = validateOpeningInsideWallProfile(highWindow, wall, stepped);
    expect(r?.code).toBe("opening.outsideProfile");
  });
});
