import { describe, expect, it } from "vitest";
import {
  CROP_FRAME_PROXIMITY_PX,
  ENTITY_PROXIMITY_PX,
  MAX_FLIP_CONTROL_RADIUS,
  MIN_PICK_LINE_THRESHOLD,
  orthoWorldPerPixel,
  perspectiveWorldPerPixel,
  pickLineThreshold,
  screenScaledRadius,
} from "./pickTolerance.js";

describe("pickTolerance (corte 7b)", () => {
  it("ortho world-per-pixel spans the frustum height", () => {
    expect(orthoWorldPerPixel(10, 400)).toBeCloseTo(0.05);
  });

  it("ortho guards a zero viewport height", () => {
    expect(orthoWorldPerPixel(10, 0)).toBeCloseTo(20);
  });

  it("perspective world-per-pixel grows with distance", () => {
    const near = perspectiveWorldPerPixel(5, 45, 400);
    const far = perspectiveWorldPerPixel(50, 45, 400);
    expect(far).toBeGreaterThan(near);
    // 2 * 5 * tan(22.5°) / 400
    expect(near).toBeCloseTo((2 * 5 * Math.tan((45 * Math.PI) / 180 / 2)) / 400);
  });

  it("perspective clamps the pivot distance floor", () => {
    expect(perspectiveWorldPerPixel(0, 45, 400)).toBeCloseTo(
      perspectiveWorldPerPixel(0.5, 45, 400),
    );
  });

  it("pick threshold scales with zoom but keeps a floor", () => {
    expect(pickLineThreshold(0.05)).toBeCloseTo(0.5);
    expect(pickLineThreshold(0.0001)).toBe(MIN_PICK_LINE_THRESHOLD);
  });

  it("screen-scaled radius honours the world floor", () => {
    expect(screenScaledRadius(0.05, 10, 0.12)).toBeCloseTo(0.5);
    expect(screenScaledRadius(0.001, 10, 0.12)).toBeCloseTo(0.12);
  });

  it("screen-scaled radius respects optional world ceiling (BUG-D4)", () => {
    // Zoomed far out: uncapped would be 2.4 world units
    expect(screenScaledRadius(0.2, 12, 0.12)).toBeCloseTo(2.4);
    expect(screenScaledRadius(0.2, 12, 0.12, MAX_FLIP_CONTROL_RADIUS)).toBe(
      MAX_FLIP_CONTROL_RADIUS,
    );
    expect(MAX_FLIP_CONTROL_RADIUS).toBeLessThanOrEqual(0.25);
  });

  // ADR 0016: the crop frame must stay easy to grab for presentation framing.
  it("crop frame tolerance is not tighter than entity picking", () => {
    expect(CROP_FRAME_PROXIMITY_PX).toBeGreaterThanOrEqual(ENTITY_PROXIMITY_PX);
  });
});
