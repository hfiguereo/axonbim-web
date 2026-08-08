import {
  cloneViewCrop,
  normalizeViewCrop,
  resizeViewCropCorner,
  type Camera,
  type CropCorner,
  type ViewCrop,
} from "@axonbim/model";

export type CropDragMeta = {
  cameraId: string | null;
  viewId: string;
  mode: "corner" | "move";
  corner: CropCorner;
  baseline: ViewCrop;
  startX: number;
  startY: number;
  baselineEye?: { x: number; y: number; z: number };
  baselineTarget?: { x: number; y: number; z: number };
};

export type CameraPoseDragLive = {
  cameraId: string;
  eye: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
};

export type CropDragStartState = {
  cropDragMeta: CropDragMeta;
  cropDragLive: ViewCrop;
  cameraPoseDragLive: CameraPoseDragLive | null;
  selectedCameraId: string | null;
  selectedCropFrameCameraId: string | null;
  status: string;
};

export type CropDragUpdateState = {
  cropDragLive: ViewCrop;
  cameraPoseDragLive: CameraPoseDragLive | null;
};

export type CropDragCommit =
  | { kind: "clear-only" }
  | { kind: "translate-camera"; cameraId: string; dx: number; dy: number }
  | { kind: "set-camera-crop"; cameraId: string; crop: ViewCrop }
  | { kind: "set-session-crop"; viewId: string; crop: ViewCrop };

/** Start corner-resize drag for camera crop or session view crop. */
export function beginCornerCropDrag(input: {
  cameraId: string | null;
  corner: CropCorner;
  activeViewId: string;
  cameras: Camera[];
  views: { id: string; crop?: ViewCrop }[];
  selectedCameraId: string | null;
  selectedCropFrameCameraId: string | null;
}): CropDragStartState | null {
  const baseline: ViewCrop | null = input.cameraId
    ? (input.cameras.find((c) => c.id === input.cameraId)?.crop ?? null)
    : (input.views.find((v) => v.id === input.activeViewId)?.crop ?? null);
  if (!baseline?.enabled) return null;
  return {
    cropDragMeta: {
      cameraId: input.cameraId,
      viewId: input.activeViewId,
      mode: "corner",
      corner: input.corner,
      baseline: cloneViewCrop(baseline),
      startX: 0,
      startY: 0,
    },
    cropDragLive: cloneViewCrop(baseline),
    cameraPoseDragLive: null,
    selectedCameraId: input.cameraId ?? input.selectedCameraId,
    selectedCropFrameCameraId: input.cameraId ?? input.selectedCropFrameCameraId,
    status: "Redimensionando recorte…",
  };
}

/** Start move drag: translate camera eye/target + crop frame together. */
export function beginCameraFrameMoveDrag(input: {
  cameraId: string;
  x: number;
  y: number;
  activeViewId: string;
  cameras: Camera[];
}): CropDragStartState | null {
  const cam = input.cameras.find((c) => c.id === input.cameraId);
  if (!cam?.crop?.enabled) return null;
  return {
    cropDragMeta: {
      cameraId: input.cameraId,
      viewId: input.activeViewId,
      mode: "move",
      corner: 0,
      baseline: cloneViewCrop(cam.crop),
      startX: input.x,
      startY: input.y,
      baselineEye: { ...cam.eye },
      baselineTarget: { ...cam.target },
    },
    cropDragLive: cloneViewCrop(cam.crop),
    cameraPoseDragLive: {
      cameraId: input.cameraId,
      eye: { ...cam.eye },
      target: { ...cam.target },
    },
    selectedCameraId: input.cameraId,
    selectedCropFrameCameraId: input.cameraId,
    status: "Moviendo cámara + marco…",
  };
}

export function updateCropDragLive(
  meta: CropDragMeta,
  x: number,
  y: number,
): CropDragUpdateState {
  if (meta.mode === "move" && meta.cameraId && meta.baselineEye && meta.baselineTarget) {
    const dx = x - meta.startX;
    const dy = y - meta.startY;
    return {
      cropDragLive: normalizeViewCrop({
        ...meta.baseline,
        minX: meta.baseline.minX + dx,
        maxX: meta.baseline.maxX + dx,
        minY: meta.baseline.minY + dy,
        maxY: meta.baseline.maxY + dy,
      }),
      cameraPoseDragLive: {
        cameraId: meta.cameraId,
        eye: {
          x: meta.baselineEye.x + dx,
          y: meta.baselineEye.y + dy,
          z: meta.baselineEye.z,
        },
        target: {
          x: meta.baselineTarget.x + dx,
          y: meta.baselineTarget.y + dy,
          z: meta.baselineTarget.z,
        },
      },
    };
  }
  return {
    cropDragLive: resizeViewCropCorner(meta.baseline, meta.corner, x, y),
    cameraPoseDragLive: null,
  };
}

export function resolveCropDragCommit(
  meta: CropDragMeta | null,
  live: ViewCrop | null,
): CropDragCommit {
  if (!meta || !live) return { kind: "clear-only" };
  if (meta.mode === "move" && meta.cameraId) {
    return {
      kind: "translate-camera",
      cameraId: meta.cameraId,
      dx: live.minX - meta.baseline.minX,
      dy: live.minY - meta.baseline.minY,
    };
  }
  if (meta.cameraId) {
    return { kind: "set-camera-crop", cameraId: meta.cameraId, crop: live };
  }
  return { kind: "set-session-crop", viewId: meta.viewId, crop: cloneViewCrop(live) };
}
