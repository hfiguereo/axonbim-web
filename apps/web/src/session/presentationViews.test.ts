import { describe, expect, it } from "vitest";
import {
  applyPresentationToViews,
  extractEnabledViewCrops,
  presentationFromViews,
} from "./presentationViews";
import type { ProjectView } from "./sessionTypes";

const planCrop = {
  enabled: true,
  minX: 0,
  minY: 0,
  maxX: 8,
  maxY: 6,
};

describe("presentationViews", () => {
  it("extracts only enabled session crops (not cameras)", () => {
    const views: ProjectView[] = [
      { id: "view.plan.level1", name: "Planta", kind: "plan", open: true, crop: planCrop },
      {
        id: "view.3d.perspective",
        name: "3D",
        kind: "perspective",
        open: true,
        crop: { ...planCrop, enabled: false },
      },
      {
        id: "view.camera.camera.1",
        name: "Cam",
        kind: "camera",
        open: true,
        cameraId: "camera.1",
        crop: planCrop,
      },
    ];
    expect(extractEnabledViewCrops(views)).toEqual({
      "view.plan.level1": planCrop,
    });
  });

  it("applies presentation crops by view id", () => {
    const views: ProjectView[] = [
      { id: "view.plan.level1", name: "Planta", kind: "plan", open: true },
      { id: "view.3d.perspective", name: "3D", kind: "perspective", open: true },
    ];
    const next = applyPresentationToViews(views, {
      viewCrops: { "view.plan.level1": planCrop },
    });
    expect(next[0]?.crop).toEqual(planCrop);
    expect(next[1]?.crop).toBeUndefined();
    expect(presentationFromViews(next).viewCrops["view.plan.level1"]).toEqual(planCrop);
  });
});
