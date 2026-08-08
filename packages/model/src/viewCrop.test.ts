import { describe, expect, it } from "vitest";
import {
  cloneViewCrop,
  defaultCameraCrop,
  normalizeViewCrop,
  resizeViewCropCorner,
  viewCropCorners,
  viewCropDepth,
  viewCropPlanLines,
  viewCropWidth,
} from "./viewCrop.js";
import type { ViewCrop } from "./types.js";

const MIN_CROP_SIZE = 0.5;

function crop(partial: Partial<ViewCrop> = {}): ViewCrop {
  return { enabled: true, minX: 0, minY: 0, maxX: 10, maxY: 6, ...partial };
}

describe("normalizeViewCrop", () => {
  it("swaps inverted bounds instead of keeping a negative box", () => {
    const out = normalizeViewCrop(crop({ minX: 9, maxX: 2, minY: 5, maxY: 1 }));
    expect(out.minX).toBe(2);
    expect(out.maxX).toBe(9);
    expect(out.minY).toBe(1);
    expect(out.maxY).toBe(5);
  });

  it("grows a degenerate box to the minimum size around its center", () => {
    const out = normalizeViewCrop(crop({ minX: 4, maxX: 4, minY: 2, maxY: 2 }));
    expect(viewCropWidth(out)).toBeCloseTo(MIN_CROP_SIZE);
    expect(viewCropDepth(out)).toBeCloseTo(MIN_CROP_SIZE);
    expect((out.minX + out.maxX) / 2).toBeCloseTo(4);
    expect((out.minY + out.maxY) / 2).toBeCloseTo(2);
  });

  it("swaps inverted Z but leaves Z absent when it was absent", () => {
    const withZ = normalizeViewCrop(crop({ minZ: 5, maxZ: 1 }));
    expect(withZ.minZ).toBe(1);
    expect(withZ.maxZ).toBe(5);

    const withoutZ = normalizeViewCrop(crop());
    expect("minZ" in withoutZ).toBe(false);
    expect("maxZ" in withoutZ).toBe(false);
  });

  it("preserves the enabled flag", () => {
    expect(normalizeViewCrop(crop({ enabled: false })).enabled).toBe(false);
  });
});

describe("cloneViewCrop", () => {
  it("does not share state with the original", () => {
    const original = crop({ minZ: 0, maxZ: 3 });
    const copy = cloneViewCrop(original);
    copy.maxX = 999;
    expect(original.maxX).toBe(10);
    expect(copy.minZ).toBe(0);
    expect(copy.maxZ).toBe(3);
  });

  it("omits Z keys when the source has none", () => {
    const copy = cloneViewCrop(crop());
    expect("minZ" in copy).toBe(false);
    expect("maxZ" in copy).toBe(false);
  });
});

describe("resizeViewCropCorner", () => {
  // Grip dragging (ADR 0016): the corner opposite the dragged one must not move.
  const cases: Array<{ corner: 0 | 1 | 2 | 3; fixed: [number, number] }> = [
    { corner: 0, fixed: [10, 6] },
    { corner: 1, fixed: [0, 6] },
    { corner: 2, fixed: [0, 0] },
    { corner: 3, fixed: [10, 0] },
  ];

  for (const { corner, fixed } of cases) {
    it(`keeps the opposite corner fixed when dragging corner ${corner}`, () => {
      const out = resizeViewCropCorner(crop(), corner, 5, 3);
      const [fx, fy] = fixed;
      expect([out.minX, out.maxX]).toContain(fx);
      expect([out.minY, out.maxY]).toContain(fy);
      expect(out.minX).toBeLessThan(out.maxX);
      expect(out.minY).toBeLessThan(out.maxY);
    });
  }

  it("normalizes instead of inverting when dragged past the opposite corner", () => {
    const out = resizeViewCropCorner(crop(), 0, 20, 20);
    expect(out.minX).toBeLessThan(out.maxX);
    expect(out.minY).toBeLessThan(out.maxY);
    expect(viewCropWidth(out)).toBeGreaterThanOrEqual(MIN_CROP_SIZE);
  });
});

describe("viewCropCorners", () => {
  /**
   * The viewer stores this `corner` index in userData and the drag code maps it
   * back through resizeViewCropCorner, so index and position must agree or a
   * grip drags the wrong side.
   */
  it("indexes corners as SW, SE, NE, NW", () => {
    const c = viewCropCorners(crop(), 1.5);
    expect(c.map((p) => p.corner)).toEqual([0, 1, 2, 3]);
    expect([c[0]!.x, c[0]!.y]).toEqual([0, 0]);
    expect([c[1]!.x, c[1]!.y]).toEqual([10, 0]);
    expect([c[2]!.x, c[2]!.y]).toEqual([10, 6]);
    expect([c[3]!.x, c[3]!.y]).toEqual([0, 6]);
    expect(c.every((p) => p.z === 1.5)).toBe(true);
  });

  it("agrees with resizeViewCropCorner about which corner moves", () => {
    const base = crop();
    for (const { corner, x, y } of viewCropCorners(base)) {
      const moved = resizeViewCropCorner(base, corner, x + 1, y + 1);
      const stillThere = viewCropCorners(moved).find((p) => p.corner === corner)!;
      expect(stillThere.x).toBeCloseTo(x + 1);
      expect(stillThere.y).toBeCloseTo(y + 1);
    }
  });
});

describe("viewCropPlanLines", () => {
  // Float32Array rounds, so heights are compared approximately.
  it("emits four closed segments at the given height", () => {
    const pts = viewCropPlanLines(crop(), 0.2);
    expect(pts).toHaveLength(24); // 4 segments × 2 points × 3 floats

    const first: [number, number] = [pts[0]!, pts[1]!];
    const last: [number, number] = [pts[21]!, pts[22]!];
    expect(first).toEqual([0, 0]);
    // The strip closes back on the first point.
    expect(last).toEqual(first);

    for (let i = 2; i < pts.length; i += 3) expect(pts[i]).toBeCloseTo(0.2);
  });

  it("walks the rectangle without repeating an edge", () => {
    const pts = viewCropPlanLines(crop());
    const xy: string[] = [];
    for (let i = 0; i < pts.length; i += 3) xy.push(`${pts[i]},${pts[i + 1]}`);
    expect(new Set(xy).size).toBe(4); // four distinct corners, each visited twice
  });
});

describe("defaultCameraCrop", () => {
  const eye = { x: 0, y: 0, z: 1.7 };
  const target = { x: 10, y: 0, z: 1.7 };

  it("covers the eye and extends toward the target", () => {
    const out = defaultCameraCrop(eye, target, 45, 8);
    expect(out.enabled).toBe(true);
    expect(out.minX).toBeLessThanOrEqual(eye.x);
    expect(out.maxX).toBeGreaterThanOrEqual(8);
    // Symmetric about the view axis for an axis-aligned camera.
    expect(out.minY).toBeCloseTo(-out.maxY);
  });

  it("widens with a larger field of view", () => {
    const narrow = defaultCameraCrop(eye, target, 20, 8);
    const wide = defaultCameraCrop(eye, target, 90, 8);
    expect(viewCropDepth(wide)).toBeGreaterThan(viewCropDepth(narrow));
  });

  it("clamps the field of view so extreme values stay usable", () => {
    expect(defaultCameraCrop(eye, target, 1, 8)).toEqual(
      defaultCameraCrop(eye, target, 10, 8),
    );
    expect(defaultCameraCrop(eye, target, 500, 8)).toEqual(
      defaultCameraCrop(eye, target, 120, 8),
    );
  });

  it("does not divide by zero when eye and target coincide", () => {
    const out = defaultCameraCrop(eye, { ...eye }, 45, 8);
    expect(Number.isFinite(out.minX)).toBe(true);
    expect(Number.isFinite(out.maxY)).toBe(true);
    expect(viewCropWidth(out)).toBeGreaterThanOrEqual(MIN_CROP_SIZE);
  });
});
