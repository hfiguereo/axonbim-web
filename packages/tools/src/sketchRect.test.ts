import { describe, expect, it } from "vitest";
import { rectangleCorners, wallAxesFromRectangle } from "./sketchRect.js";

describe("sketchRect (SK-v1)", () => {
  it("builds four CCW wall axes from opposite corners", () => {
    const axes = wallAxesFromRectangle(
      { x: 0, y: 0, z: 1 },
      { x: 4, y: 3, z: 1 },
    );
    expect(axes).toHaveLength(4);
    expect(axes[0]).toEqual({
      p1: { x: 0, y: 0, z: 1 },
      p2: { x: 4, y: 0, z: 1 },
    });
    expect(axes[2]!.p1).toEqual({ x: 4, y: 3, z: 1 });
    expect(axes[3]!.p2).toEqual({ x: 0, y: 0, z: 1 });
  });

  it("rejects degenerate rectangles", () => {
    expect(
      wallAxesFromRectangle({ x: 0, y: 0, z: 0 }, { x: 0.01, y: 2, z: 0 }),
    ).toEqual([]);
  });

  it("normalizes inverted corners", () => {
    const corners = rectangleCorners(
      { x: 5, y: 5, z: 0 },
      { x: 1, y: 2, z: 0 },
    );
    expect(corners[0]).toEqual({ x: 1, y: 2, z: 0 });
    expect(corners[2]).toEqual({ x: 5, y: 5, z: 0 });
  });
});
