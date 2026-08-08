import { describe, expect, it } from "vitest";
import { resolveCameraPresetPose } from "./cameraPresetPose.js";

describe("cameraPresetPose (corte 5)", () => {
  const orbit = { x: 10, y: 20, z: 3 };

  it("top looks down +Z with Y-up", () => {
    const pose = resolveCameraPresetPose("top", orbit, 5);
    expect(pose.useOrtho3d).toBe(true);
    expect(pose.eye.x).toBeCloseTo(10);
    expect(pose.eye.y).toBeCloseTo(20);
    expect(pose.eye.z).toBeCloseTo(8);
    expect(pose.up).toEqual({ x: 0, y: 1, z: 0 });
    expect(pose.orthoHalfH).toBeCloseTo(5 * 0.55);
  });

  it("iso uses perspective and unit direction", () => {
    const pose = resolveCameraPresetPose("iso", orbit, 10);
    expect(pose.useOrtho3d).toBe(false);
    expect(pose.up).toEqual({ x: 0, y: 0, z: 1 });
    const dx = pose.eye.x - orbit.x;
    const dy = pose.eye.y - orbit.y;
    const dz = pose.eye.z - orbit.z;
    expect(Math.hypot(dx, dy, dz)).toBeCloseTo(10);
  });

  it("clamps distance to at least 3", () => {
    const pose = resolveCameraPresetPose("front", orbit, 1);
    expect(pose.eye.y).toBeCloseTo(20 - 3);
    expect(pose.orthoHalfH).toBeCloseTo(Math.max(2, 3 * 0.55));
  });
});
