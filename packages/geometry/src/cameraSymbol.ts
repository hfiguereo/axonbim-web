import type { Camera } from "@axonbim/model";

/** Plan glyph: camera body + look direction cone (line strip positions). */
export type CameraPlanSymbol = {
  lines: Float32Array;
  /** Hit proxy center for picking. */
  pick: { x: number; y: number; z: number };
};

/**
 * Simple plan symbol for a geometric camera: triangle pointing toward target.
 */
export function cameraPlanSymbol(cam: Camera): CameraPlanSymbol {
  const dx = cam.target.x - cam.eye.x;
  const dy = cam.target.y - cam.eye.y;
  const len = Math.hypot(dx, dy) || 1;
  const fx = dx / len;
  const fy = dy / len;
  const px = -fy;
  const py = fx;
  const size = 0.35;
  const tipX = cam.eye.x + fx * size;
  const tipY = cam.eye.y + fy * size;
  const b1x = cam.eye.x - fx * size * 0.35 + px * size * 0.45;
  const b1y = cam.eye.y - fy * size * 0.35 + py * size * 0.45;
  const b2x = cam.eye.x - fx * size * 0.35 - px * size * 0.45;
  const b2y = cam.eye.y - fy * size * 0.35 - py * size * 0.45;
  const z = 0.02;
  // Triangle outline + short look line
  const lookX = cam.eye.x + fx * size * 1.6;
  const lookY = cam.eye.y + fy * size * 1.6;
  const lines = new Float32Array([
    tipX, tipY, z, b1x, b1y, z,
    b1x, b1y, z, b2x, b2y, z,
    b2x, b2y, z, tipX, tipY, z,
    cam.eye.x, cam.eye.y, z, lookX, lookY, z,
  ]);
  return {
    lines,
    pick: { x: cam.eye.x, y: cam.eye.y, z },
  };
}

/**
 * Horizontal FOV footprint in plan (vision cone): eye → base chord at `distance`.
 * When crop is enabled, distance follows the crop AABB along the look direction.
 */
export function cameraVisionConeLines(cam: Camera, fallbackDistance = 8): Float32Array {
  const dx = cam.target.x - cam.eye.x;
  const dy = cam.target.y - cam.eye.y;
  const len = Math.hypot(dx, dy) || 1;
  const fx = dx / len;
  const fy = dy / len;
  const px = -fy;
  const py = fx;

  let distance = fallbackDistance;
  if (cam.crop?.enabled) {
    const corners = [
      { x: cam.crop.minX, y: cam.crop.minY },
      { x: cam.crop.maxX, y: cam.crop.minY },
      { x: cam.crop.maxX, y: cam.crop.maxY },
      { x: cam.crop.minX, y: cam.crop.maxY },
    ];
    let maxAlong = 0;
    for (const c of corners) {
      const along = (c.x - cam.eye.x) * fx + (c.y - cam.eye.y) * fy;
      if (along > maxAlong) maxAlong = along;
    }
    if (maxAlong > 0.5) distance = maxAlong;
  }

  const aspect = 16 / 9;
  const vFov = (Math.min(120, Math.max(10, cam.fov)) * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const halfW = distance * Math.tan(hFov / 2);
  const baseX = cam.eye.x + fx * distance;
  const baseY = cam.eye.y + fy * distance;
  const c1x = baseX + px * halfW;
  const c1y = baseY + py * halfW;
  const c2x = baseX - px * halfW;
  const c2y = baseY - py * halfW;
  const z = 0.025;
  return new Float32Array([
    cam.eye.x, cam.eye.y, z, c1x, c1y, z,
    c1x, c1y, z, c2x, c2y, z,
    c2x, c2y, z, cam.eye.x, cam.eye.y, z,
  ]);
}
