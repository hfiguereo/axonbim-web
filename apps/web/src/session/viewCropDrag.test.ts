import { describe, expect, it } from "vitest";
import type { Camera, ViewCrop } from "@axonbim/model";
import {
  beginCameraFrameMoveDrag,
  beginCornerCropDrag,
  resolveCropDragCommit,
  updateCropDragLive,
} from "./viewCropDrag";

const crop: ViewCrop = {
  enabled: true,
  minX: 0,
  minY: 0,
  maxX: 10,
  maxY: 8,
};

const camera: Camera = {
  id: "camera.1",
  name: "Cámara 1",
  eye: { x: 1, y: 2, z: 1.7 },
  target: { x: 5, y: 2, z: 1.7 },
  fov: 45,
  crop,
};

describe("viewCropDrag (corte 2)", () => {
  it("beginCornerCropDrag returns null if crop disabled", () => {
    const start = beginCornerCropDrag({
      cameraId: "camera.1",
      corner: 0,
      activeViewId: "view.plan.level1",
      cameras: [{ ...camera, crop: { ...crop, enabled: false } }],
      views: [],
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
    });
    expect(start).toBeNull();
  });

  it("beginCornerCropDrag clones baseline for camera", () => {
    const start = beginCornerCropDrag({
      cameraId: "camera.1",
      corner: 2,
      activeViewId: "view.plan.level1",
      cameras: [camera],
      views: [],
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
    });
    expect(start?.cropDragMeta.mode).toBe("corner");
    expect(start?.cropDragMeta.corner).toBe(2);
    expect(start?.cropDragLive).toEqual(crop);
    expect(start?.selectedCameraId).toBe("camera.1");
  });

  it("updateCropDragLive move shifts crop and pose", () => {
    const start = beginCameraFrameMoveDrag({
      cameraId: "camera.1",
      x: 0,
      y: 0,
      activeViewId: "view.plan.level1",
      cameras: [camera],
    });
    expect(start).not.toBeNull();
    const upd = updateCropDragLive(start!.cropDragMeta, 3, -1);
    expect(upd.cropDragLive.minX).toBe(3);
    expect(upd.cropDragLive.maxX).toBe(13);
    expect(upd.cameraPoseDragLive?.eye.x).toBe(4);
    expect(upd.cameraPoseDragLive?.target.y).toBe(1);
  });

  it("resolveCropDragCommit translate for move mode", () => {
    const start = beginCameraFrameMoveDrag({
      cameraId: "camera.1",
      x: 0,
      y: 0,
      activeViewId: "view.plan.level1",
      cameras: [camera],
    });
    const live = updateCropDragLive(start!.cropDragMeta, 2, 1).cropDragLive;
    const commit = resolveCropDragCommit(start!.cropDragMeta, live);
    expect(commit).toEqual({
      kind: "translate-camera",
      cameraId: "camera.1",
      dx: 2,
      dy: 1,
    });
  });

  it("resolveCropDragCommit set-camera-crop for corner", () => {
    const start = beginCornerCropDrag({
      cameraId: "camera.1",
      corner: 0,
      activeViewId: "view.plan.level1",
      cameras: [camera],
      views: [],
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
    });
    const live = updateCropDragLive(start!.cropDragMeta, -1, -1).cropDragLive;
    const commit = resolveCropDragCommit(start!.cropDragMeta, live);
    expect(commit.kind).toBe("set-camera-crop");
    if (commit.kind === "set-camera-crop") {
      expect(commit.cameraId).toBe("camera.1");
      expect(commit.crop.minX).toBe(-1);
    }
  });

  it("resolveCropDragCommit session crop when no cameraId", () => {
    const start = beginCornerCropDrag({
      cameraId: null,
      corner: 0,
      activeViewId: "view.plan.level1",
      cameras: [],
      views: [{ id: "view.plan.level1", crop }],
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
    });
    const commit = resolveCropDragCommit(start!.cropDragMeta, start!.cropDragLive);
    expect(commit).toEqual({
      kind: "set-session-crop",
      viewId: "view.plan.level1",
      crop,
    });
  });
});
