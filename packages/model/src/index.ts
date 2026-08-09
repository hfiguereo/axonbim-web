export type {
  AxonDocument,
  Camera,
  DocumentPresentation,
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
export {
  OPENING_END_MARGIN,
  OPENING_OVERLAP_GAP,
  OPENING_VERTICAL_MARGIN,
  asOpeningSpec,
  openingsOnWall,
  openingsOverlap,
  validateHostedOpening,
  validateOpeningClearOfOthers,
  validateOpeningFitsWall,
  wallLengthXY,
} from "./openingFit.js";
export type { HostedOpeningSpec } from "./openingFit.js";
export {
  findDoorFamily,
  findWallFamily,
  findWindowFamily,
  pickCatalogId,
  reconcileActiveFamilyIds,
} from "./catalog.js";
export type { ActiveFamilyIds } from "./catalog.js";
export {
  getActiveStorey,
  getActiveStoreyElevation,
  reconcileActiveStoreyId,
} from "./activeStorey.js";
export { deriveStoreyDatums, storeyToDatum } from "./storeyDatum.js";
export type { StoreyDatum } from "./storeyDatum.js";
export { computeModelEnvelope } from "./modelEnvelope.js";
export type { ModelEnvelope } from "./modelEnvelope.js";
export {
  allProjectionBases,
  getProjectionBasis,
  projectWorldToDrawing,
} from "./projectionBasis.js";
export type { ProjectionBasis, ProjectionBasisId } from "./projectionBasis.js";
export {
  getActiveWorkplane,
  pointOnWorkplaneXY,
  projectPointOntoWorkplane,
  resolveSpatialReference,
  workplaneFromStorey,
  workplanePointFromUV,
} from "./workplane.js";
export type { SpatialReferenceContext, Workplane, WorkplaneKind } from "./workplane.js";
