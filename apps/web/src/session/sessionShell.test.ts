import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "@axonbim/model";
import { defaultViews } from "./defaultViews";
import {
  nextDetailLevel,
  nextGraphicScale,
  nextVisualStyle,
} from "./displayCycles";
import { touchDoc } from "./touchDoc";

describe("session shell peels (corte 7a)", () => {
  it("defaultViews opens plan + perspective", () => {
    const views = defaultViews();
    expect(views).toHaveLength(2);
    expect(views[0]?.kind).toBe("plan");
    expect(views[1]?.kind).toBe("perspective");
    expect(views.every((v) => v.open)).toBe(true);
  });

  it("display cycles wrap", () => {
    expect(nextGraphicScale("1:200")).toBe("1:20");
    expect(nextVisualStyle("shaded")).toBe("wireframe");
    expect(nextDetailLevel("fine")).toBe("coarse");
  });

  it("touchDoc replaces array identities without deep-cloning walls", () => {
    const doc = createEmptyDocument();
    doc.walls.push({
      id: "w1",
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 1, y: 0, z: 0 },
      height: 2.7,
      thickness: 0.15,
      familyId: "f",
      storeyId: "s",
    });
    const wall = doc.walls[0]!;
    const next = touchDoc(doc);
    expect(next).not.toBe(doc);
    expect(next.walls).not.toBe(doc.walls);
    expect(next.walls[0]).toBe(wall);
    expect(next.meta).not.toBe(doc.meta);
  });
});
