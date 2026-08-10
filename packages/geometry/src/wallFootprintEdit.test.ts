import { describe, expect, it } from "vitest";
import { invertStoreyFootprint } from "./wallResultOutline.js";
import { moveFootprintCornerConstrained } from "./wallFootprintEdit.js";

describe("moveFootprintCornerConstrained", () => {
  it("one corner lengthens an axis-aligned footprint", () => {
    const half = 0.075;
    const corners = [
      { x: 0, y: -half, z: 0 },
      { x: 2, y: -half, z: 0 },
      { x: 2, y: half, z: 0 },
      { x: 0, y: half, z: 0 },
    ];
    // Move the +U / +V corner (index 2) further along U.
    const next = moveFootprintCornerConstrained(
      corners,
      2,
      { x: 5, y: half, z: 0 },
      { x: 1, y: 0 },
    );
    expect(next).not.toBeNull();
    const inv = invertStoreyFootprint(next!);
    expect(inv).not.toBeNull();
    expect(Math.hypot(inv!.p2.x - inv!.p1.x, inv!.p2.y - inv!.p1.y)).toBeCloseTo(
      5,
      3,
    );
    expect(inv!.thickness).toBeCloseTo(0.15, 3);
  });
});
