import { describe, expect, it } from "vitest";
import type { Camera, ViewCrop } from "@axonbim/model";
import {
  defaultSessionViewCrop,
  resolveActiveViewCrop,
  resolveClippingCrop,
  type CropResolveInput,
} from "./viewCropResolve";

const sessionCrop: ViewCrop = {
  enabled: true,
  minX: 0,
  minY: 0,
  maxX: 10,
  maxY: 10,
};

const cameraCrop: ViewCrop = {
  enabled: true,
  minX: 100,
  minY: 100,
  maxX: 110,
  maxY: 110,
};

const camera: Camera = {
  id: "camera.1",
  name: "Cámara 1",
  eye: { x: 0, y: 0, z: 1.7 },
  target: { x: 1, y: 0, z: 1.7 },
  fov: 45,
  crop: cameraCrop,
};

function base(partial: Partial<CropResolveInput> = {}): CropResolveInput {
  return {
    views: [
      { id: "view.plan.level1", kind: "plan", crop: sessionCrop },
      { id: "view.3d.perspective", kind: "perspective" },
      { id: "view.camera.1", kind: "camera", cameraId: "camera.1" },
    ],
    activeViewId: "view.plan.level1",
    documentCameras: [camera],
    selectedCameraId: null,
    cropDragLive: null,
    cropDragMeta: null,
    ...partial,
  };
}

describe("viewCropResolve (ADR 0016)", () => {
  it("defaultSessionViewCrop pads wall bbox", () => {
    const crop = defaultSessionViewCrop([
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 8, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ]);
    expect(crop.enabled).toBe(true);
    expect(crop.minX).toBe(-1);
    expect(crop.maxX).toBe(9);
  });

  it("resolveActiveViewCrop: plan + selected camera → camera crop", () => {
    const crop = resolveActiveViewCrop(
      base({ selectedCameraId: "camera.1", activeViewId: "view.plan.level1" }),
    );
    expect(crop).toEqual(cameraCrop);
  });

  it("resolveClippingCrop: plan never uses camera crop", () => {
    const crop = resolveClippingCrop(
      base({ selectedCameraId: "camera.1", activeViewId: "view.plan.level1" }),
    );
    expect(crop).toEqual(sessionCrop);
  });

  it("resolveClippingCrop: camera view uses camera crop", () => {
    const crop = resolveClippingCrop(base({ activeViewId: "view.camera.1" }));
    expect(crop).toEqual(cameraCrop);
  });

  it("resolveClippingCrop: dragging camera crop on plan does not clip plan", () => {
    const live: ViewCrop = { ...cameraCrop, minX: 50 };
    const crop = resolveClippingCrop(
      base({
        activeViewId: "view.plan.level1",
        cropDragLive: live,
        cropDragMeta: { cameraId: "camera.1" },
      }),
    );
    expect(crop).toEqual(sessionCrop);
  });

  it("resolveClippingCrop: dragging session crop on plan uses live", () => {
    const live: ViewCrop = { ...sessionCrop, minX: -2 };
    const crop = resolveClippingCrop(
      base({
        activeViewId: "view.plan.level1",
        cropDragLive: live,
        cropDragMeta: { cameraId: null },
      }),
    );
    expect(crop).toEqual(live);
  });
});
