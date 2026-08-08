import { describe, expect, it } from "vitest";
import {
  EPS_AREA,
  EPS_LENGTH,
  MIN_HEIGHT,
  MIN_THICKNESS,
  MIN_WALL_LENGTH,
  SNAP_TOLERANCE,
  almostEqual,
} from "./index.js";

describe("almostEqual", () => {
  it("accepts differences within the tolerance and rejects larger ones", () => {
    expect(almostEqual(1, 1 + EPS_LENGTH / 2)).toBe(true);
    expect(almostEqual(1, 1 + EPS_LENGTH * 10)).toBe(false);
  });

  it("treats the tolerance as inclusive", () => {
    expect(almostEqual(0, EPS_LENGTH)).toBe(true);
  });

  it("is symmetric and sign-independent", () => {
    expect(almostEqual(-5, -5)).toBe(true);
    expect(almostEqual(2, 2.5, 1)).toBe(almostEqual(2.5, 2, 1));
  });

  it("honours an explicit tolerance over the default", () => {
    expect(almostEqual(0, 0.4, 0.5)).toBe(true);
    expect(almostEqual(0, 0.4)).toBe(false);
  });
});

describe("tolerance constants", () => {
  it("are all positive", () => {
    for (const v of [
      EPS_LENGTH,
      EPS_AREA,
      MIN_WALL_LENGTH,
      MIN_THICKNESS,
      MIN_HEIGHT,
      SNAP_TOLERANCE,
    ]) {
      expect(v).toBeGreaterThan(0);
    }
  });

  /**
   * Numeric noise must stay far below the smallest real dimension, otherwise
   * validation and snapping would start rejecting or merging legitimate input.
   */
  it("keep epsilons well below the minimum real dimensions", () => {
    expect(EPS_AREA).toBeLessThan(EPS_LENGTH);
    expect(EPS_LENGTH).toBeLessThan(MIN_WALL_LENGTH);
    expect(EPS_LENGTH).toBeLessThan(MIN_THICKNESS);
    expect(EPS_LENGTH).toBeLessThan(MIN_HEIGHT);
    expect(EPS_LENGTH).toBeLessThan(SNAP_TOLERANCE);
  });

  it("do not let snapping reach across a minimum-length wall", () => {
    expect(SNAP_TOLERANCE).toBeLessThanOrEqual(MIN_WALL_LENGTH);
  });
});
