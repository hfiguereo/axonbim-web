/**
 * SK-wall-profile-v1 Bloque 5 — minimal view context for vertical wall profile edit.
 * Not LR4 technical elevations; only the gate needed for this tool (ADR 0018 §8).
 */
import type { ViewKind } from "./sessionTypes.js";

export type WallProfileViewContext = {
  allowed: boolean;
  /** Status message when not allowed (Spanish, UI-ready). */
  reason?: string;
};

/**
 * Whether the active ProjectView kind may start vertical wall-profile sketch.
 * Perspective includes gizmo ortho presets (front/side/iso) as usable stand-ins.
 */
export function wallProfileEditContext(viewKind: ViewKind): WallProfileViewContext {
  if (viewKind === "plan") {
    return {
      allowed: false,
      reason:
        "Perfil vertical: no disponible en planta — abre Perspectiva 3D (o preset de elevación) y haz doble clic en una cara",
    };
  }
  if (viewKind === "camera") {
    return {
      allowed: false,
      reason:
        "Perfil vertical: no disponible en cámara documental — usa la pestaña Perspectiva 3D",
    };
  }
  return { allowed: true };
}
