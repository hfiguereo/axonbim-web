/** Named camera poses for the 3D viewport (ADR 0014 gizmo). */
export type CameraPreset =
  | "top"
  | "bottom"
  | "front"
  | "back"
  | "left"
  | "right"
  | "iso";

export type Vec3 = { x: number; y: number; z: number };

export type CameraPresetPose = {
  eye: Vec3;
  up: Vec3;
  /** Non-iso presets use orthographic 3D; iso uses perspective. */
  useOrtho3d: boolean;
  /** Suggested ortho half-height when `useOrtho3d` (framing ≈ prior distance). */
  orthoHalfH: number;
};

type UnitDir = {
  d: readonly [number, number, number];
  up: readonly [number, number, number];
};

const PRESET_UNITS: Record<CameraPreset, UnitDir> = {
  top: { d: [0, 0, 1], up: [0, 1, 0] },
  bottom: { d: [0, 0, -1], up: [0, 1, 0] },
  front: { d: [0, -1, 0], up: [0, 0, 1] },
  back: { d: [0, 1, 0], up: [0, 0, 1] },
  right: { d: [1, 0, 0], up: [0, 0, 1] },
  left: { d: [-1, 0, 0], up: [0, 0, 1] },
  iso: { d: [0.75, -0.9, 0.65], up: [0, 0, 1] },
};

/**
 * Pure eye/up pose for a named preset around an orbit pivot.
 * Clamps distance to ≥ 3 (same as previous `createViewport` behavior).
 */
export function resolveCameraPresetPose(
  preset: CameraPreset,
  orbit: Vec3,
  distance: number,
): CameraPresetPose {
  const dist = Math.max(3, distance);
  const u = PRESET_UNITS[preset];
  const len = Math.hypot(u.d[0], u.d[1], u.d[2]) || 1;
  return {
    eye: {
      x: orbit.x + (u.d[0] / len) * dist,
      y: orbit.y + (u.d[1] / len) * dist,
      z: orbit.z + (u.d[2] / len) * dist,
    },
    up: { x: u.up[0], y: u.up[1], z: u.up[2] },
    useOrtho3d: preset !== "iso",
    orthoHalfH: Math.max(2, dist * 0.55),
  };
}
