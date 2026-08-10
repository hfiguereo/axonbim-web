import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { RectWallAxis, SketchPoint } from "./sketchRect.js";

/** Consecutive wall axes from a polyline; drops segments shorter than MIN_WALL_LENGTH. */
export function wallAxesFromPolyline(points: SketchPoint[]): RectWallAxis[] {
  const axes: RectWallAxis[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (len < MIN_WALL_LENGTH) continue;
    axes.push({
      p1: { x: p1.x, y: p1.y, z: p1.z },
      p2: { x: p2.x, y: p2.y, z: p2.z },
    });
  }
  return axes;
}
