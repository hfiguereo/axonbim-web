import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./create.js";
import {
  getActiveWorkplane,
  pointOnWorkplaneXY,
  projectPointOntoWorkplane,
  resolveSpatialReference,
  workplaneFromStorey,
  workplanePointFromUV,
} from "./workplane.js";

describe("workplane (WP-v1)", () => {
  it("builds a horizontal storey workplane at elevation", () => {
    const wp = workplaneFromStorey({ id: "s1", name: "N2", elevation: 3 });
    expect(wp.kind).toBe("storey");
    expect(wp.storeyId).toBe("s1");
    expect(wp.origin.z).toBe(3);
    expect(wp.normal).toEqual({ x: 0, y: 0, z: 1 });
    expect(wp.axisU).toEqual({ x: 1, y: 0, z: 0 });
    expect(wp.axisV).toEqual({ x: 0, y: 1, z: 0 });
  });

  it("resolves spatial context from active storey", () => {
    const doc = createEmptyDocument();
    doc.storeys[0]!.elevation = 1.25;
    const ctx = resolveSpatialReference(doc, "storey.default");
    expect(ctx.storeyId).toBe("storey.default");
    expect(ctx.workplane.origin.z).toBe(1.25);
    expect(getActiveWorkplane(doc, null).origin.z).toBe(1.25);
  });

  it("projects points onto the plane without mutating inputs", () => {
    const wp = workplaneFromStorey({ id: "s", name: "N", elevation: 2 });
    const p = { x: 4, y: 5, z: 9 };
    const on = projectPointOntoWorkplane(wp, p);
    expect(on).toEqual({ x: 4, y: 5, z: 2 });
    expect(p.z).toBe(9);
  });

  it("maps XY and UV onto the storey plane", () => {
    const wp = workplaneFromStorey({ id: "s", name: "N", elevation: 0.5 });
    expect(pointOnWorkplaneXY(wp, 1, 2)).toEqual({ x: 1, y: 2, z: 0.5 });
    expect(workplanePointFromUV(wp, 3, 4)).toEqual({ x: 3, y: 4, z: 0.5 });
  });
});
