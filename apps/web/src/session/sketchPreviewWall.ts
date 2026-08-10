/**
 * H3 — derived solid preview while sketching a wall profile.
 * Builds a display-only Wall clone from the provisional ring; never mutates AxonDocument.
 */
import type { Wall } from "@axonbim/model";
import { profileVertices, type SketchProfile } from "@axonbim/tools";
import { worldRingToWallVertical } from "./worldRingToWallVertical.js";

/**
 * @returns Wall clone with provisional `vertical`, or null if the ring is not yet valid.
 */
export function previewWallFromSketchProfile(
  host: Wall,
  profile: SketchProfile,
): Wall | null {
  if (!profile.closed) return null;
  const ring = profileVertices(profile);
  if (ring.length < 3) return null;
  const vertical = worldRingToWallVertical(host, ring);
  if (!vertical) return null;
  return { ...host, vertical };
}
