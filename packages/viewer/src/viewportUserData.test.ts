import { describe, expect, it } from "vitest";
import {
  CAMERA_ID,
  CORNER,
  CROP_FRAME,
  CROP_GRIP,
  DOOR_ID,
  ENTITY_ID,
  ENTITY_PICK_KEYS,
  ENTITY_TYPE,
  FLIP_CONTROL,
  isValidCropCorner,
  KIND,
  parseFlipPickUserData,
  WALL_ID,
} from "./viewportUserData.js";

describe("viewportUserData contract (Fase 3)", () => {
  it("entity pick keys are stable strings shared by sync and picking", () => {
    expect(ENTITY_PICK_KEYS.wall).toBe("wallId");
    expect(ENTITY_PICK_KEYS.door).toBe("doorId");
    expect(ENTITY_PICK_KEYS.window).toBe("windowId");
    expect(ENTITY_PICK_KEYS.camera).toBe("cameraId");
    expect(WALL_ID).toBe(ENTITY_PICK_KEYS.wall);
    expect(DOOR_ID).toBe(ENTITY_PICK_KEYS.door);
  });

  it("crop overlay keys match ADR 0016 layout", () => {
    expect(CROP_FRAME).toBe("cropFrame");
    expect(CROP_GRIP).toBe("cropGrip");
    expect(CORNER).toBe("corner");
    expect(CAMERA_ID).toBe("cameraId");
  });

  it("isValidCropCorner accepts only 0–3", () => {
    expect(isValidCropCorner(0)).toBe(true);
    expect(isValidCropCorner(3)).toBe(true);
    expect(isValidCropCorner(-1)).toBe(false);
    expect(isValidCropCorner(4)).toBe(false);
    expect(isValidCropCorner("1")).toBe(false);
    expect(isValidCropCorner(null)).toBe(false);
  });

  it("parseFlipPickUserData rejects incomplete flip grips", () => {
    expect(parseFlipPickUserData(undefined)).toBeNull();
    expect(parseFlipPickUserData({ [FLIP_CONTROL]: true })).toBeNull();
    expect(
      parseFlipPickUserData({
        [FLIP_CONTROL]: true,
        [ENTITY_TYPE]: "door",
        [ENTITY_ID]: "d1",
        [KIND]: "swing",
      }),
    ).toEqual({ entityType: "door", entityId: "d1", kind: "swing" });
    expect(
      parseFlipPickUserData({
        [FLIP_CONTROL]: true,
        [ENTITY_TYPE]: "window",
        [ENTITY_ID]: "w1",
        [KIND]: "hinge",
      }),
    ).toEqual({ entityType: "window", entityId: "w1", kind: "hinge" });
    expect(
      parseFlipPickUserData({
        [FLIP_CONTROL]: true,
        [ENTITY_TYPE]: "wall",
        [ENTITY_ID]: "x",
        [KIND]: "swing",
      }),
    ).toBeNull();
  });
});
