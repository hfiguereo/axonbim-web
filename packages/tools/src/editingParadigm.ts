/**
 * SK-v1 — editing paradigms share Workplane (WP-v1) but not edit rules.
 * Sketch Mode: parametric BIM only on a defined workplane (never free mesh / camera plane).
 * Product focus: floor/slab, terrain, sweep profiles — SK-v1 proves the pattern (rect→walls).
 * Edit Mode / Family Editor / Push&Pull stay parked.
 */
export type EditingParadigm = "parametric" | "sketch";

/** Mirrors `DrawMode` in index — kept local to avoid circular imports. */
type DrawModeId =
  | "line"
  | "rectangle"
  | "arcSER"
  | "arcCE"
  | "pickLines"
  | "pickFace";

/** Line chain = parametric wall placement. Rectangle (and future arcs) = sketch. */
export function paradigmForDrawMode(mode: DrawModeId): EditingParadigm {
  return mode === "line" ? "parametric" : "sketch";
}

export function isSketchDrawMode(mode: DrawModeId): boolean {
  return paradigmForDrawMode(mode) === "sketch";
}

/** All ribbon Dibujar modes are ready (SK-draw). */
export function isSketchDrawModeReady(_mode: DrawModeId): boolean {
  return true;
}
