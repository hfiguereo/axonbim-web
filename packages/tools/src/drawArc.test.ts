import { describe, expect, it } from "vitest";
import {
  ARC_SEGMENTS,
  closerEndpoint,
  sampleArcCE,
  sampleArcSER,
} from "./drawArc.js";
import { wallAxesFromPolyline } from "./drawPolyline.js";

describe("drawArc / drawPolyline (SK-draw)", () => {
  it("samples a quarter-circle SER and yields wall axes", () => {
    const start = { x: 1, y: 0, z: 0 };
    const end = { x: 0, y: 1, z: 0 };
    const through = { x: Math.SQRT1_2, y: Math.SQRT1_2, z: 0 };
    const pts = sampleArcSER(start, end, through, 8);
    expect(pts.length).toBe(9);
    expect(pts[0]!.x).toBeCloseTo(1, 5);
    expect(pts[0]!.y).toBeCloseTo(0, 5);
    expect(pts[pts.length - 1]!.x).toBeCloseTo(0, 5);
    expect(pts[pts.length - 1]!.y).toBeCloseTo(1, 5);
    const axes = wallAxesFromPolyline(pts);
    expect(axes.length).toBe(8);
  });

  it("rejects colinear SER", () => {
    expect(
      sampleArcSER(
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ),
    ).toEqual([]);
  });

  it("samples minor arc CE (90°)", () => {
    const pts = sampleArcCE(
      { x: 0, y: 0, z: 1 },
      { x: 2, y: 0, z: 1 },
      { x: 0, y: 2, z: 1 },
      ARC_SEGMENTS,
    );
    expect(pts.length).toBe(ARC_SEGMENTS + 1);
    expect(pts[0]).toEqual({ x: 2, y: 0, z: 1 });
    expect(pts[pts.length - 1]!.x).toBeCloseTo(0, 5);
    expect(pts[pts.length - 1]!.y).toBeCloseTo(2, 5);
  });

  it("closerEndpoint picks nearest wall end", () => {
    const wall = {
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 4, y: 0, z: 0 },
    };
    expect(closerEndpoint(wall, { x: 0.1, y: 0.2, z: 0 })).toEqual(wall.p1);
    expect(closerEndpoint(wall, { x: 3.9, y: 0, z: 0 })).toEqual(wall.p2);
  });

  it("wallAxesFromPolyline drops short segments", () => {
    const axes = wallAxesFromPolyline([
      { x: 0, y: 0, z: 0 },
      { x: 0.01, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ]);
    expect(axes).toHaveLength(1);
    expect(axes[0]!.p1.x).toBe(0.01);
  });
});
