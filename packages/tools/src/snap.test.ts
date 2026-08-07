import { describe, expect, it } from "vitest";
import { almostEqual } from "@axonbim/shared";
import { collectEndpoints, orthoFrom, snapWallPoint } from "./snap";

describe("snapWallPoint", () => {
  it("snaps to endpoint within tolerance", () => {
    const r = snapWallPoint({
      raw: { x: 4.03, y: 0.02, z: 0 },
      pending: null,
      chainOrigin: null,
      endpoints: [
        { x: 0, y: 0, z: 0 },
        { x: 4, y: 0, z: 0 },
      ],
      tolerance: 0.05,
    });
    expect(r.kind).toBe("endpoint");
    expect(almostEqual(r.point.x, 4)).toBe(true);
    expect(almostEqual(r.point.y, 0)).toBe(true);
  });

  it("closes to chain origin", () => {
    const origin = { x: 0, y: 0, z: 0 };
    const r = snapWallPoint({
      raw: { x: 0.02, y: -0.01, z: 0 },
      pending: { x: 4, y: 0, z: 0 },
      chainOrigin: origin,
      endpoints: [],
      tolerance: 0.05,
    });
    expect(r.kind).toBe("close");
    expect(r.closed).toBe(true);
    expect(almostEqual(r.point.x, 0)).toBe(true);
  });

  it("applies soft ortho near horizontal axis", () => {
    const r = snapWallPoint({
      raw: { x: 3, y: 0.03, z: 0 },
      pending: { x: 0, y: 0, z: 0 },
      chainOrigin: null,
      endpoints: [],
      tolerance: 0.05,
    });
    expect(r.kind).toBe("ortho");
    expect(almostEqual(r.point.y, 0)).toBe(true);
    expect(almostEqual(r.point.x, 3)).toBe(true);
  });

  it("applies soft ortho by angle (~12°)", () => {
    // ~8° from horizontal over 5 m
    const r = snapWallPoint({
      raw: { x: 5, y: 0.7, z: 0 },
      pending: { x: 0, y: 0, z: 0 },
      chainOrigin: null,
      endpoints: [],
    });
    expect(r.kind).toBe("ortho");
    expect(almostEqual(r.point.y, 0)).toBe(true);
  });

  it("forceOrtho picks nearer axis", () => {
    const o = orthoFrom({ x: 0, y: 0, z: 0 }, { x: 5, y: 1, z: 0 });
    expect(almostEqual(o.y, 0)).toBe(true);
    const r = snapWallPoint({
      raw: { x: 5, y: 1, z: 0 },
      pending: { x: 0, y: 0, z: 0 },
      chainOrigin: null,
      endpoints: [],
      forceOrtho: true,
    });
    expect(r.kind).toBe("ortho");
    expect(almostEqual(r.point.y, 0)).toBe(true);
  });
});

describe("collectEndpoints", () => {
  it("dedupes shared corners", () => {
    const eps = collectEndpoints([
      { p1: { x: 0, y: 0, z: 0 }, p2: { x: 4, y: 0, z: 0 } },
      { p1: { x: 4, y: 0, z: 0 }, p2: { x: 4, y: 3, z: 0 } },
    ]);
    expect(eps).toHaveLength(3);
  });
});
