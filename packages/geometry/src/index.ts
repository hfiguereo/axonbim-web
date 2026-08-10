export type { MeshBuffer } from "./types";
export {
  emptyMesh,
  wallBoxMesh,
  wallMetrics,
  computeWallJoinDirs,
  miterCorners,
} from "./wallBox";
export type { WallMetrics, WallMeshOptions, WallJoinDirs, Vec2 } from "./wallBox";
export {
  faceLineToWallAxis,
  findWallLoop,
  insetRingToAxes,
  invertStoreyFootprint,
  invertVerticalFaceOutline,
  isWallBoxFootprint,
  outlineOnWorkplane,
  wallBoxCorners3,
  wallBoxPlanCorners,
} from "./wallResultOutline";
export type { ResultOutline } from "./wallResultOutline";
export {
  footprintCornersToEdges,
  moveFootprintCornerConstrained,
} from "./wallFootprintEdit";
export type { Vec2 as FootprintAxis2 } from "./wallFootprintEdit";
export {
  validateSketchProfileForHost,
} from "./sketchProfileValidate";
export type {
  SketchProfileValidateCtx,
  SketchProfileValidateResult,
  ValidatableProfile,
} from "./sketchProfileValidate";
export {
  wallMeshWithOpenings,
  openingsFromDoors,
  openingsFromWindows,
  openingsFromHosted,
  projectPointOnWall,
} from "./openings";
export type { WallOpening } from "./openings";
export {
  ensureProfileCcw,
  meshBufferBBox,
  profileLoopArea,
  triangulateProfileLoop,
  wallProfileMesh,
  wallProfileMetrics,
  wallProfileSupportsMiter,
} from "./wallProfileMesh";
export type { WallProfileMeshOptions } from "./wallProfileMesh";
export {
  doorBasis,
  doorLeafMesh,
  doorAssemblyMeshes,
  doorPlanSymbol,
} from "./doorGeometry";
export type { DoorBasis, DoorMeshes, DoorPlanSymbol } from "./doorGeometry";
export {
  windowAssemblyMeshes,
  windowPlanSymbol,
  WINDOW_JAMB_W,
  WINDOW_HEAD_H,
  WINDOW_SILL_H,
} from "./windowGeometry";
export type { WindowMeshes, WindowPlanSymbol } from "./windowGeometry";
export type { PlanFlipControl } from "./planControls";
export { cameraPlanSymbol, cameraVisionConeLines } from "./cameraSymbol";
export type { CameraPlanSymbol } from "./cameraSymbol";
