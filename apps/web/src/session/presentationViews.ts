/**
 * Session plan/perspective crops ↔ document.presentation (ADR 0016 rev. persist).
 * Camera crops stay on `document.cameras[].crop`.
 */
import { cloneViewCrop, type DocumentPresentation, type ViewCrop } from "@axonbim/model";
import type { ProjectView } from "./sessionTypes.js";

/** Only enabled crops of session-owned views are persisted. */
export function extractEnabledViewCrops(
  views: readonly ProjectView[],
): Record<string, ViewCrop> {
  const viewCrops: Record<string, ViewCrop> = {};
  for (const v of views) {
    if (v.kind === "camera") continue;
    if (v.crop?.enabled) {
      viewCrops[v.id] = cloneViewCrop(v.crop);
    }
  }
  return viewCrops;
}

export function presentationFromViews(
  views: readonly ProjectView[],
): DocumentPresentation {
  return { viewCrops: extractEnabledViewCrops(views) };
}

/** Apply persisted crops onto session views (match by id). */
export function applyPresentationToViews(
  views: readonly ProjectView[],
  presentation: DocumentPresentation | undefined,
): ProjectView[] {
  const crops = presentation?.viewCrops;
  if (!crops || Object.keys(crops).length === 0) {
    return views.map((v) => ({ ...v }));
  }
  return views.map((v) => {
    if (v.kind === "camera") return { ...v };
    const crop = crops[v.id];
    if (!crop) return { ...v };
    return { ...v, crop: cloneViewCrop(crop) };
  });
}
