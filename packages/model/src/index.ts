export type {
  AxonDocument,
  Camera,
  Door,
  DoorLeafState,
  DoorSwing,
  ProjectMeta,
  Storey,
  ViewCrop,
  Wall,
  Window,
} from "./types.js";
export { DOOR_LEAF_ANGLE_RAD } from "./types.js";
export { createDemoDocument, createEmptyDocument } from "./create.js";
export {
  cloneViewCrop,
  defaultCameraCrop,
  normalizeViewCrop,
  resizeViewCropCorner,
  viewCropCorners,
  viewCropDepth,
  viewCropPlanLines,
  viewCropWidth,
} from "./viewCrop.js";
export type { CropCorner } from "./viewCrop.js";
export {
  MAX_CAMERA_FOV,
  MIN_CAMERA_EYE_TARGET_DISTANCE,
  MIN_CAMERA_FOV,
  documentRefs,
  validateCamera,
  validateDoor,
  validateViewCrop,
  validateWall,
  validateWindow,
} from "./validate.js";
export type { DocumentRefs, ValidationIssue, ValidationResult } from "./validate.js";
