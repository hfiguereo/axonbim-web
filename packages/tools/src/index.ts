/** Interaction tools — wall draw arrives in Etapa 1. */

export type ToolId = "select" | "wall" | "none";

/** Revit-like Draw panel modes while a sketch/placement tool is active. */
export type DrawMode =
  | "line"
  | "rectangle"
  | "arcSER" // start-end-radius
  | "arcCE" // center-ends
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
