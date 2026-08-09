import {
  normalizeViewCrop,
  type Camera,
  type ViewCrop,
  type Wall,
} from "@axonbim/model";

export type CropViewRef = {
  id: string;
  kind: "plan" | "perspective" | "camera";
  cameraId?: string;
  crop?: ViewCrop;
};

export type CropResolveInput = {
  views: CropViewRef[];
  activeViewId: string;
  documentCameras: Camera[];
  selectedCameraId: string | null;
  cropDragLive: ViewCrop | null;
  cropDragMeta: { cameraId: string | null } | null;
};

/** Default session crop when the user first enables viewport crop (plan: wall bbox). */
export function defaultSessionViewCrop(walls: Wall[]): ViewCrop {
  if (walls.length === 0) {
    return normalizeViewCrop({
      enabled: true,
      minX: -5,
      minY: -5,
      maxX: 5,
      maxY: 5,
    });
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.p1.x, w.p2.x);
    maxX = Math.max(maxX, w.p1.x, w.p2.x);
    minY = Math.min(minY, w.p1.y, w.p2.y);
    maxY = Math.max(maxY, w.p1.y, w.p2.y);
  }
  const pad = 1;
  return normalizeViewCrop({
    enabled: true,
    minX: minX - pad,
    minY: minY - pad,
    maxX: maxX + pad,
    maxY: maxY + pad,
  });
}

/**
 * Crop shown/edited in props (camera if selected or camera view; else session).
 */
export function resolveActiveViewCrop(s: CropResolveInput): ViewCrop | null {
  if (s.cropDragLive) return s.cropDragLive;
  const view = s.views.find((v) => v.id === s.activeViewId);
  if (!view) return null;
  if (view.kind === "camera" && view.cameraId) {
    return s.documentCameras.find((c) => c.id === view.cameraId)?.crop ?? null;
  }
  // On plan only: selecting a camera edits that camera's crop (props / grips).
  // Free perspective always edits its own session crop (C3 / ADR 0016).
  if (s.selectedCameraId && view.kind === "plan") {
    return s.documentCameras.find((c) => c.id === s.selectedCameraId)?.crop ?? null;
  }
  return view.crop ?? null;
}

/**
 * Crop that actually clips geometry for the active view.
 * Plan/perspective → session ProjectView.crop only.
 * Camera view → that Camera.crop. Never clips plan with a camera crop.
 */
export function resolveClippingCrop(s: CropResolveInput): ViewCrop | null {
  const view = s.views.find((v) => v.id === s.activeViewId);
  if (!view) return null;

  // Live drag: only affects clip if it matches what this view clips
  if (s.cropDragLive && s.cropDragMeta) {
    if (s.cropDragMeta.cameraId) {
      if (view.kind === "camera" && view.cameraId === s.cropDragMeta.cameraId) {
        return s.cropDragLive;
      }
      // Dragging camera crop while on plan/perspective → do not clip the plan
    } else if (view.kind === "plan" || view.kind === "perspective") {
      return s.cropDragLive;
    }
  }

  if (view.kind === "camera" && view.cameraId) {
    return s.documentCameras.find((c) => c.id === view.cameraId)?.crop ?? null;
  }
  // Plan and free 3D: independent session crop only
  return view.crop ?? null;
}
