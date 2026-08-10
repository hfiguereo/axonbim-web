import { describe, expect, it } from "vitest";
import { workplaneFromStorey } from "@axonbim/model";
import { validateSketchProfileForHost } from "./sketchProfileValidate.js";

const wp = workplaneFromStorey({ id: "s1", name: "N0", elevation: 0 });

describe("validateSketchProfileForHost", () => {
  it("rejects empty / too-short edges", () => {
    const r = validateSketchProfileForHost(
      {
        sourceWallIds: ["w1"],
        closed: true,
        semantic: "result",
        edges: [
          {
            p1: { x: 0, y: 0, z: 0 },
            p2: { x: 0.01, y: 0, z: 0 },
          },
        ],
      },
      { workplane: wp, sourceCount: 1, hasOpenings: false, thickness: 0.15 },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toMatch(/empty|short/);
  });

  it("accepts a valid 4-edge storey footprint", () => {
    const h = 0.075;
    const r = validateSketchProfileForHost(
      {
        sourceWallIds: ["w1"],
        closed: true,
        semantic: "result",
        edges: [
          { p1: { x: 0, y: -h, z: 0 }, p2: { x: 3, y: -h, z: 0 } },
          { p1: { x: 3, y: -h, z: 0 }, p2: { x: 3, y: h, z: 0 } },
          { p1: { x: 3, y: h, z: 0 }, p2: { x: 0, y: h, z: 0 } },
          { p1: { x: 0, y: h, z: 0 }, p2: { x: 0, y: -h, z: 0 } },
        ],
      },
      { workplane: wp, sourceCount: 1, hasOpenings: false, thickness: 0.15 },
    );
    expect(r.ok).toBe(true);
  });

  it("accepts a free non-rect footprint (axes-on-replace path)", () => {
    const r = validateSketchProfileForHost(
      {
        sourceWallIds: ["w1"],
        closed: true,
        semantic: "result",
        edges: [
          { p1: { x: 0, y: 0, z: 0 }, p2: { x: 3, y: 0, z: 0 } },
          { p1: { x: 3, y: 0, z: 0 }, p2: { x: 4, y: 1, z: 0 } },
          { p1: { x: 4, y: 1, z: 0 }, p2: { x: 0, y: 1.2, z: 0 } },
          { p1: { x: 0, y: 1.2, z: 0 }, p2: { x: 0, y: 0, z: 0 } },
        ],
      },
      { workplane: wp, sourceCount: 1, hasOpenings: false, thickness: 0.15 },
    );
    expect(r.ok).toBe(true);
  });

  it("rejects replace when host has openings", () => {
    const h = 0.075;
    const r = validateSketchProfileForHost(
      {
        sourceWallIds: ["w1"],
        closed: true,
        semantic: "result",
        edges: [
          { p1: { x: 0, y: -h, z: 0 }, p2: { x: 3, y: -h, z: 0 } },
          { p1: { x: 3, y: -h, z: 0 }, p2: { x: 3, y: h, z: 0 } },
          { p1: { x: 3, y: h, z: 0 }, p2: { x: 0, y: h, z: 0 } },
          { p1: { x: 0, y: h, z: 0 }, p2: { x: 0, y: -h, z: 0 } },
        ],
      },
      { workplane: wp, sourceCount: 1, hasOpenings: true, thickness: 0.15 },
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("profile.openings");
  });
});
