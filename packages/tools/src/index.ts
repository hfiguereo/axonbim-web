/** Interaction tools — wall draw, snapping (MVP). */

export type ToolId = "select" | "wall" | "door" | "window" | "none";

/** Revit-like Draw panel modes while a sketch/placement tool is active. */
export type DrawMode =
  | "line"
  | "rectangle"
  | "arcSER"
  | "arcCE"
  | "pickLines"
  | "pickFace";

export type ToolSession = {
  activeTool: ToolId;
  drawMode: DrawMode;
};

/** Tools that sketch geometry (open Modify + Draw), not one-click insert. */
export function isSketchTool(tool: ToolId): boolean {
  return tool === "wall";
}

/** One-click host placement (door/window on wall). */
export function isHostedTool(tool: ToolId): boolean {
  return tool === "door" || tool === "window";
}

export type Point2 = { x: number; y: number; z: number };

/** First click of a wall segment, or null. */
export type WallDrawState = {
  pending: Point2 | null;
  hover: Point2 | null;
};

export {
  collectEndpoints,
  orthoFrom,
  snapWallPoint,
  ORTHO_ANGLE_DEG,
  type SnapContext,
  type SnapKind,
  type SnapResult,
} from "./snap";
