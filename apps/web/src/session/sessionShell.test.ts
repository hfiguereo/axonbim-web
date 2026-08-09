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

  it("touchDoc replaces collection identities without deep-cloning entities", () => {
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
    doc.cameras.push({
      id: "camera.1",
      name: "Cámara 1",
      eye: { x: 0, y: 0, z: 1.7 },
      target: { x: 1, y: 0, z: 1.7 },
      fov: 45,
      crop: { enabled: false, minX: -1, minY: -1, maxX: 1, maxY: 1 },
    });
    const wall = doc.walls[0]!;
    const camera = doc.cameras[0]!;
    const next = touchDoc(doc);
    expect(next).not.toBe(doc);
    expect(next.walls).not.toBe(doc.walls);
    expect(next.doors).not.toBe(doc.doors);
    expect(next.windows).not.toBe(doc.windows);
    expect(next.cameras).not.toBe(doc.cameras);
    expect(next.storeys).not.toBe(doc.storeys);
    expect(next.families).not.toBe(doc.families);
    expect(next.doorFamilies).not.toBe(doc.doorFamilies);
    expect(next.windowFamilies).not.toBe(doc.windowFamilies);
    expect(next.walls[0]).toBe(wall);
    expect(next.cameras[0]).toBe(camera);
    expect(next.meta).not.toBe(doc.meta);
  });
});

