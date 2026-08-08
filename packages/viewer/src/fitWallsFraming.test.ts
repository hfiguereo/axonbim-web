import { describe, expect, it } from "vitest";
import {
  computeWallsFitBounds,
  resolvePerspectiveFitFraming,
  resolvePlanFitFraming,
} from "./fitWallsFraming.js";

describe("fitWallsFraming (corte 6)", () => {
  it("computeWallsFitBounds returns null for empty", () => {
    expect(computeWallsFitBounds([])).toBeNull();
  });

  it("centers AABB and computes span", () => {
    const bounds = computeWallsFitBounds([
      {
        p1: { x: 0, y: 0 },
        p2: { x: 10, y: 0 },
        height: 3,
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 4 },
        height: 4,
      },
    ]);
    expect(bounds).not.toBeNull();
    expect(bounds!.cx).toBeCloseTo(5);
    expect(bounds!.cy).toBeCloseTo(2);
    expect(bounds!.maxH).toBe(4);
    // max(10, 4, 2) * 0.7 + 2 = 9
    expect(bounds!.span).toBeCloseTo(9);
  });

  it("resolvePlanFitFraming places ortho above center", () => {
    const framing = resolvePlanFitFraming({
      cx: 1,
      cy: 2,
      maxH: 3,
      span: 5,
    });
    expect(framing.position).toEqual({ x: 1, y: 2, z: 40 });
    expect(framing.lookAt).toEqual({ x: 1, y: 2, z: 0 });
    expect(framing.orthoHalfH).toBe(5);
  });

  it("resolvePerspectiveFitFraming offsets eye from orbit", () => {
    const framing = resolvePerspectiveFitFraming({
      cx: 0,
      cy: 0,
      maxH: 10,
      span: 4,
    });
    expect(framing.orbit).toEqual({ x: 0, y: 0, z: 3.5 });
    expect(framing.eye).toEqual({ x: 4, y: -4.8, z: 3.6 });
    expect(framing.up).toEqual({ x: 0, y: 0, z: 1 });
    expect(framing.orthoHalfH).toBe(4);
  });
});
