/** Three.js Object3D.userData keys for viewport picking and overlays. */

export const WALL_ID = "wallId";
export const DOOR_ID = "doorId";
export const WINDOW_ID = "windowId";
export const CAMERA_ID = "cameraId";

export const CROP_FRAME = "cropFrame";
export const CROP_GRIP = "cropGrip";
export const CORNER = "corner";

export const FLIP_CONTROL = "flipControl";
export const ENTITY_TYPE = "entityType";
export const ENTITY_ID = "entityId";
export const KIND = "kind";

/** Stable contract: sync writes these keys; picking reads them. */
export const ENTITY_PICK_KEYS = {
  wall: WALL_ID,
  door: DOOR_ID,
  window: WINDOW_ID,
  camera: CAMERA_ID,
} as const;

export type CropCornerIndex = 0 | 1 | 2 | 3;

/** ADR 0016: crop grips use corner indices 0–3 only. */
export function isValidCropCorner(value: unknown): value is CropCornerIndex {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export type FlipPickUserData = {
  entityType: "door" | "window";
  entityId: string;
  kind: "swing" | "hinge";
};

/** Parse flip-control userData written by documentSceneSync. */
export function parseFlipPickUserData(
  userData: Record<string, unknown> | undefined,
): FlipPickUserData | null {
  if (!userData?.[FLIP_CONTROL]) return null;
  const entityType = userData[ENTITY_TYPE];
  const entityId = userData[ENTITY_ID];
  const kind = userData[KIND];
  if (
    (entityType !== "door" && entityType !== "window") ||
    typeof entityId !== "string" ||
    (kind !== "swing" && kind !== "hinge")
  ) {
    return null;
  }
  return { entityType, entityId, kind };
}
