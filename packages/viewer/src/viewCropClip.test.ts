import { describe, expect, it } from "vitest";
import { cropToClipPlaneEquations } from "./viewCropClip.js";

describe("viewCropClip (corte 4)", () => {
  it("cropToClipPlaneEquations emits XY planes", () => {
    const planes = cropToClipPlaneEquations({
      enabled: true,
      minX: 1,
      minY: 2,
      maxX: 9,
      maxY: 8,
    });
    expect(planes).toHaveLength(4);
    expect(planes[0]).toEqual([1, 0, 0, -1]);
    expect(planes[1]).toEqual([-1, 0, 0, 9]);
    expect(planes[2]).toEqual([0, 1, 0, -2]);
    expect(planes[3]).toEqual([0, -1, 0, 8]);
  });

  it("includes Z planes when minZ/maxZ set", () => {
    const planes = cropToClipPlaneEquations({
      enabled: true,
      minX: 0,
      minY: 0,
      maxX: 1,
      maxY: 1,
      minZ: 0.5,
      maxZ: 2.5,
    });
    expect(planes).toHaveLength(6);
    expect(planes[4]).toEqual([0, 0, 1, -0.5]);
    expect(planes[5]).toEqual([0, 0, -1, 2.5]);
  });
});
