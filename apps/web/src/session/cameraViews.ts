/**
 * F9-E4 policy A: camera tabs are derived from `document.cameras`.
 * Plan / perspective views stay session-owned; camera views are rebuilt after
 * every document change so undo/redo/import cannot leave orphans.
 */
import type { Camera } from "@axonbim/model";
import type { ProjectView } from "./sessionTypes.js";

export function cameraViewId(cameraId: string): string {
  return `view.camera.${cameraId}`;
}

/** Session-owned views only (plan / free perspective). */
export function sessionOwnedViews(views: readonly ProjectView[]): ProjectView[] {
  return views.filter((v) => v.kind !== "camera");
}

export function deriveCameraViews(
  cameras: readonly Camera[],
  previousViews: readonly ProjectView[],
): ProjectView[] {
  return cameras.map((c) => {
    const prev = previousViews.find((v) => v.cameraId === c.id);
    return {
      id: cameraViewId(c.id),
      name: c.name,
      kind: "camera" as const,
      open: prev?.open ?? true,
      cameraId: c.id,
    };
  });
}

export function mergeViewsWithDocument(
  views: readonly ProjectView[],
  cameras: readonly Camera[],
): ProjectView[] {
  return [...sessionOwnedViews(views), ...deriveCameraViews(cameras, views)];
}

export function resolveActiveViewId(
  activeViewId: string,
  views: readonly ProjectView[],
): string {
  if (views.some((v) => v.id === activeViewId)) return activeViewId;
  return views[0]?.id ?? "view.plan.level1";
}

export function patchViewsAfterDocumentChange(
  currentViews: readonly ProjectView[],
  currentActiveViewId: string,
  cameras: readonly Camera[],
): { views: ProjectView[]; activeViewId: string } {
  const views = mergeViewsWithDocument(currentViews, cameras);
  return {
    views,
    activeViewId: resolveActiveViewId(currentActiveViewId, views),
  };
}
