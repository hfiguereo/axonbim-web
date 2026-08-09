import { describe, expect, it } from "vitest";
import { CAMERA_VIEW_CROP_INSET, isInsideCameraViewFrame } from "./cameraViewNav";

describe("isInsideCameraViewFrame", () => {
  it("uses full host when crop frame is hidden", () => {
    expect(isInsideCameraViewFrame(10, 10, 100, 100, false)).toBe(true);
    expect(isInsideCameraViewFrame(-1, 10, 100, 100, false)).toBe(false);
  });

  it("respects 8% inset when crop frame is visible", () => {
    const w = 1000;
    const h = 500;
    const inset = CAMERA_VIEW_CROP_INSET;
    // Outside matte (near host edge)
    expect(isInsideCameraViewFrame(10, 10, w, h, true, inset)).toBe(false);
    // Inside matte
    expect(isInsideCameraViewFrame(w / 2, h / 2, w, h, true, inset)).toBe(true);
    // On inner edge
    expect(isInsideCameraViewFrame(w * inset, h * inset, w, h, true, inset)).toBe(true);
  });
});
