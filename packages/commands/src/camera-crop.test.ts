import { describe, expect, it } from "vitest";
import {
  createEmptyDocument,
  defaultCameraCrop,
  type Camera,
} from "@axonbim/model";
import { CreateCameraCommand, SetCameraCropCommand, createCameraId } from "./index";

describe("camera crop (ADR 0016)", () => {
  it("defaultCameraCrop is enabled AABB ahead of the eye", () => {
    const crop = defaultCameraCrop(
      { x: 0, y: 0, z: 1.7 },
      { x: 5, y: 0, z: 1.7 },
      45,
    );
    expect(crop.enabled).toBe(true);
    expect(crop.maxX).toBeGreaterThan(crop.minX);
    expect(crop.maxY).toBeGreaterThan(crop.minY);
    expect(crop.maxX).toBeGreaterThan(0);
  });

  it("CreateCameraCommand stores crop; SetCameraCropCommand undoes", () => {
    const doc = createEmptyDocument("t");
    const id = createCameraId();
    const eye = { x: 0, y: 0, z: 1.7 };
    const target = { x: 4, y: 0, z: 1.7 };
    const camera: Camera = {
      id,
      name: "C1",
      eye,
      target,
      fov: 45,
      crop: defaultCameraCrop(eye, target, 45),
    };
    expect(new CreateCameraCommand(camera).execute(doc)).toBe(true);
    expect(doc.cameras[0]!.crop.enabled).toBe(true);

    const prevMaxY = doc.cameras[0]!.crop.maxY;
    const cmd = new SetCameraCropCommand(id, {
      ...camera.crop,
      minX: -1,
      minY: -1,
      maxX: 2,
      maxY: 3,
    });
    expect(cmd.execute(doc)).toBe(true);
    expect(doc.cameras[0]!.crop.maxY).toBe(3);
    cmd.undo(doc);
    expect(doc.cameras[0]!.crop.maxY).toBe(prevMaxY);
  });
});
