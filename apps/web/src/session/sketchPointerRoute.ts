/**
 * Viewport routing for sketch clicks on a provisional profile.
 * Modificar tools must beat grip/vertex edit (otherwise UI never calls sketchModifyClick).
 */
export type SketchPointerRoute =
  | "wallClick"
  | "profileVertexPlace"
  | "profileVertexSelect"
  | "none";

export function routeSketchWallPointer(opts: {
  sketchModifyMode: string;
  profileVertexIndex: number | null;
  hitVertexIndex: number;
  drawMode: string;
}): SketchPointerRoute {
  // Bloque 6B — Modificar (move/rotate/split/fillet/copy/…)
  if (
    opts.sketchModifyMode &&
    opts.sketchModifyMode !== "vertex" &&
    opts.sketchModifyMode !== "redraw"
  ) {
    return "wallClick";
  }

  if (opts.profileVertexIndex != null) return "profileVertexPlace";
  if (opts.hitVertexIndex >= 0) return "profileVertexSelect";
  if (opts.drawMode === "line" || opts.drawMode === "pickLines") {
    return "wallClick";
  }
  // Miss grip in non-draw modes: clear / no-op via profileVertexClick.
  return "profileVertexPlace";
}
