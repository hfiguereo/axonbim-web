import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./create.js";
import type { Wall } from "./types.js";
import {
  getActiveWorkplane,
  intersectRayWorkplane,
  pointOnWorkplaneXY,
  projectPointOntoWorkplane,
  resolveSpatialReference,
  workplaneFromLineTrace,
  workplaneFromStorey,
  workplaneFromWallFace,
  workplanePointFromUV,
  worldToWorkplaneUV,
} from "./workplane.js";

describe("workplane (WP-v1 / WP-v2)", () => {
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

  it("builds a vertical wall-face workplane", () => {
    const wall: Wall = {
      id: "wall.1",
      storeyId: "storey.default",
      familyId: "family.block-150",
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 4, y: 0, z: 0 },
      height: 2.7,
      thickness: 0.2,
    };
    const front = workplaneFromWallFace(wall, "front");
    expect(front).not.toBeNull();
    expect(front!.kind).toBe("surface");
    expect(front!.normal.y).toBeCloseTo(1);
    expect(front!.axisV).toEqual({ x: 0, y: 0, z: 1 });
    expect(front!.origin.y).toBeCloseTo(0.1);
    expect(front!.host).toEqual({ kind: "wall", id: "wall.1", face: "front" });

    const back = workplaneFromWallFace(wall, "back");
    expect(back!.normal.y).toBeCloseTo(-1);
    expect(back!.origin.y).toBeCloseTo(-0.1);
  });

  it("builds a vertical plane from a plan line trace", () => {
    const wp = workplaneFromLineTrace(
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      "storey.default",
      1.5,
    );
    expect(wp).not.toBeNull();
    expect(wp!.kind).toBe("line");
    expect(wp!.origin.z).toBe(1.5);
    expect(wp!.axisU.x).toBeCloseTo(1);
    expect(wp!.axisV.z).toBe(1);
    expect(wp!.normal.y).toBeCloseTo(-1); // U×V with U=+X, V=+Z
    expect(workplaneFromLineTrace({ x: 0, y: 0, z: 0 }, { x: 0.01, y: 0, z: 0 }, "s", 0)).toBeNull();
  });

  it("intersects a ray with a vertical workplane", () => {
    const wp = workplaneFromLineTrace(
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      "s",
      0,
    )!;
    // Plane is y=0 (normal +Y), origin at (1,0,0)
    const hit = intersectRayWorkplane(
      wp,
      { x: 1, y: -2, z: 1 },
      { x: 0, y: 1, z: 0 },
    );
    expect(hit).not.toBeNull();
    expect(hit!.y).toBeCloseTo(0);
    expect(hit!.z).toBeCloseTo(1);
    const uv = worldToWorkplaneUV(wp, hit!);
    expect(uv.v).toBeCloseTo(1);
  });
});
