import { describe, expect, it } from "vitest";
import { almostEqual } from "@axonbim/shared";
import {
  collectEndpoints,
  emptySnapSession,
  orthoFrom,
  snapWallPoint,
} from "./snap";

const pending = { x: 0, y: 0, z: 0 };

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
    expect(r.session.axisLock).toBe("none");
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
      pending,
      chainOrigin: null,
      endpoints: [],
      tolerance: 0.05,
    });
    expect(r.kind).toBe("ortho");
    expect(r.session.axisLock).toBe("horizontal");
    expect(almostEqual(r.point.y, 0)).toBe(true);
    expect(almostEqual(r.point.x, 3)).toBe(true);
  });

  it("enters horizontal lock by enter angle (~12°)", () => {
    // ~8° from horizontal over 5 m
    const r = snapWallPoint({
      raw: { x: 5, y: 0.7, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
    });
    expect(r.kind).toBe("ortho");
    expect(r.session.axisLock).toBe("horizontal");
    expect(almostEqual(r.point.y, 0)).toBe(true);
  });

  it("enters vertical lock near vertical", () => {
    const r = snapWallPoint({
      raw: { x: 0.4, y: 5, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
    });
    expect(r.kind).toBe("ortho");
    expect(r.session.axisLock).toBe("vertical");
    expect(almostEqual(r.point.x, 0)).toBe(true);
  });

  it("holds horizontal lock inside hold band (hysteresis)", () => {
    // ~18° — outside enter (12°) but inside hold (22°)
    const locked = snapWallPoint({
      raw: { x: 5, y: 0.5, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
    });
    expect(locked.session.axisLock).toBe("horizontal");

    const held = snapWallPoint({
      raw: { x: 5, y: 1.62, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
      session: locked.session,
    });
    expect(held.kind).toBe("ortho");
    expect(held.session.axisLock).toBe("horizontal");
    expect(almostEqual(held.point.y, 0)).toBe(true);

    // Same angle without prior lock → free (no enter)
    const fresh = snapWallPoint({
      raw: { x: 5, y: 1.62, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
      session: emptySnapSession(),
    });
    expect(fresh.kind).toBe("none");
    expect(fresh.session.axisLock).toBe("none");
  });

  it("unlocks when leaving hold band", () => {
    const locked = snapWallPoint({
      raw: { x: 5, y: 0.5, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
    });
    expect(locked.session.axisLock).toBe("horizontal");

    // ~35° from horizontal
    const unlocked = snapWallPoint({
      raw: { x: 5, y: 3.5, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
      session: locked.session,
    });
    expect(unlocked.kind).toBe("none");
    expect(unlocked.session.axisLock).toBe("none");
  });

  it("endpoint snap takes precedence over ortho lock", () => {
    const locked = snapWallPoint({
      raw: { x: 5, y: 0.2, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
    });
    expect(locked.session.axisLock).toBe("horizontal");

    // Within endpoint hit radius (~0.2 m) while still near the locked axis.
    const r = snapWallPoint({
      raw: { x: 4.05, y: 0.08, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [{ x: 4, y: 0, z: 0 }],
      session: locked.session,
      tolerance: 0.05,
    });
    expect(r.kind).toBe("endpoint");
    expect(almostEqual(r.point.x, 4)).toBe(true);
  });

  it("forceOrtho picks nearer axis and locks", () => {
    const o = orthoFrom(pending, { x: 5, y: 1, z: 0 });
    expect(almostEqual(o.y, 0)).toBe(true);
    const r = snapWallPoint({
      raw: { x: 5, y: 1, z: 0 },
      pending,
      chainOrigin: null,
      endpoints: [],
      forceOrtho: true,
    });
    expect(r.kind).toBe("ortho");
    expect(r.session.axisLock).toBe("horizontal");
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
