import type { ViewCrop } from "@axonbim/model";

export type OrbitPivotMode = "model" | "selection";

/** Default eye height for new cameras (m). */
export const DEFAULT_CAMERA_EYE_Z = 1.7;
export const DEFAULT_CAMERA_FOV = 45;

export type RibbonTab =
  | "architecture"
  | "structure"
  | "insert"
  | "annotate"
  | "analyze"
  | "massing"
  | "collaborate"
  | "view"
  | "manage"
  | "modify"
  | "contextual"
  | "project"; // legacy alias unused in tabs

export type ViewKind = "plan" | "perspective" | "camera";
export type VisualStyle = "wireframe" | "hiddenLine" | "shaded";
export type DetailLevel = "coarse" | "medium" | "fine";

/** Docked to app edge or floating over drawing area (reference-product habit). */
export type DockSide = "left" | "right" | "float";
export type PanelId = "browser" | "properties";
export type FloatPos = { x: number; y: number };

export type ProjectView = {
  id: string;
  name: string;
  kind: ViewKind;
  open: boolean;
  /** When kind === "camera", links to AxonDocument.cameras[].id */
  cameraId?: string;
  /**
   * Session-only crop for plan / free perspective (ADR 0016).
   * Camera views use Camera.crop instead.
   */
  crop?: ViewCrop;
};
