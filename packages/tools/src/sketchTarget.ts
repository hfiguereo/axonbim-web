/**
 * SK-sel — Sketch Mode bound to an active parametric element.
 * Session-only; never persisted in AxonDocument.
 */

export type SketchTargetKind = "wall";

export type SketchTarget = {
  kind: SketchTargetKind;
  id: string;
};

/** Types that can open Sketch-on-selection today (profile hosts later: slab, etc.). */
export function canEnterSketchOnKind(kind: string): kind is SketchTargetKind {
  return kind === "wall";
}
