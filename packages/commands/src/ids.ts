import type { AxonDocument } from "@axonbim/model";
import { resetCameraIdSeq } from "./cameras";
import { resetDoorIdSeq } from "./doors";
import { resetWallIdSeq } from "./walls";
import { resetWindowIdSeq } from "./windows";

/** Extract trailing integer from ids like `wall.12` / `door.3`. */
export function maxNumericSuffix(ids: string[], prefix: string): number {
  let max = 0;
  for (const id of ids) {
    if (!id.startsWith(prefix)) continue;
    const rest = id.slice(prefix.length);
    if (!/^\d+$/.test(rest)) continue;
    const n = Number(rest);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/**
 * After import/demo/load: align ID generators with the highest existing N
 * so the next create*Id does not collide.
 */
export function syncIdSequencesFromDocument(doc: AxonDocument): void {
  resetWallIdSeq(maxNumericSuffix(doc.walls.map((w) => w.id), "wall."));
  resetDoorIdSeq(maxNumericSuffix(doc.doors.map((d) => d.id), "door."));
  resetWindowIdSeq(maxNumericSuffix(doc.windows.map((w) => w.id), "window."));
  resetCameraIdSeq(maxNumericSuffix((doc.cameras ?? []).map((c) => c.id), "camera."));
}
