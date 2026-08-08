import { SetCameraCropCommand, TranslateCameraPlanCommand } from "@axonbim/commands";
import {
  cloneViewCrop,
  normalizeViewCrop,
  resizeViewCropCorner,
  type CropCorner,
  type ViewCrop,
} from "@axonbim/model";
import { defaultViews } from "./defaultViews.js";
import { applyCommand } from "./sliceContracts.js";
import type { ProjectView, ViewKind } from "./sessionTypes.js";
import type { SessionSliceCreator } from "./sliceTypes.js";
import {
  beginCameraFrameMoveDrag,
  beginCornerCropDrag,
  resolveCropDragCommit,
  updateCropDragLive,
  type CropDragMeta,
} from "./viewCropDrag.js";
import {
  defaultSessionViewCrop,
  resolveActiveViewCrop,
  resolveClippingCrop,
} from "./viewCropResolve.js";

export const createViewCropSlice: SessionSliceCreator<{
  views: ProjectView[];
  activeViewId: string;
  cropDragLive: ViewCrop | null;
  cropDragMeta: CropDragMeta | null;
  cameraPoseDragLive: {
    cameraId: string;
    eye: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  getActiveViewCrop: () => ViewCrop | null;
  getClippingCrop: () => ViewCrop | null;
  setActiveViewCropEnabled: (enabled: boolean) => void;
  setActiveViewCropSize: (width: number, depth: number) => void;
  setActiveViewCrop: (crop: ViewCrop) => void;
  resizeActiveViewCropCorner: (corner: CropCorner, x: number, y: number) => void;
  beginCropDrag: (cameraId: string | null, corner: CropCorner) => void;
  beginCameraFrameMove: (cameraId: string, x: number, y: number) => void;
  updateCropDrag: (x: number, y: number) => void;
  commitCropDrag: () => void;
  cancelCropDrag: () => void;
  setActiveView: (id: string) => void;
  ensureViewOpen: (id: string) => void;
  addView: (kind: ViewKind) => void;
}> = (set, get) => ({
  views: defaultViews(),
  activeViewId: "view.plan.level1",
  cropDragLive: null,
  cropDragMeta: null,
  cameraPoseDragLive: null,

  getActiveViewCrop: () => {
    const s = get();
    return resolveActiveViewCrop({
      views: s.views,
      activeViewId: s.activeViewId,
      documentCameras: s.document.cameras,
      selectedCameraId: s.selectedCameraId,
      cropDragLive: s.cropDragLive,
      cropDragMeta: s.cropDragMeta,
    });
  },

  getClippingCrop: () => {
    const s = get();
    return resolveClippingCrop({
      views: s.views,
      activeViewId: s.activeViewId,
      documentCameras: s.document.cameras,
      selectedCameraId: s.selectedCameraId,
      cropDragLive: s.cropDragLive,
      cropDragMeta: s.cropDragMeta,
    });
  },

  setActiveViewCropEnabled: (enabled) => {
    const s = get();
    const view = s.views.find((v) => v.id === s.activeViewId);
    if (!view) return;

    if (view.kind === "camera" && view.cameraId) {
      const cam = s.document.cameras.find((c) => c.id === view.cameraId);
      if (!cam) return;
      const next = cloneViewCrop(cam.crop);
      next.enabled = enabled;
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(view.cameraId, next),
        enabled ? "Recortar vista: sí" : "Recortar vista: no",
      );
      return;
    }

    if (s.selectedCameraId && view.kind === "plan") {
      const cam = s.document.cameras.find((c) => c.id === s.selectedCameraId);
      if (cam) {
        const next = cloneViewCrop(cam.crop);
        next.enabled = enabled;
        applyCommand(
          get,
          set,
          new SetCameraCropCommand(cam.id, next),
          enabled ? "Recortar vista: sí" : "Recortar vista: no",
        );
        return;
      }
    }

    const base = view.crop ?? defaultSessionViewCrop(s.document.walls);
    const next = normalizeViewCrop({ ...base, enabled });
    set({
      views: s.views.map((v) => (v.id === view.id ? { ...v, crop: next } : v)),
      status: enabled ? "Recortar vista: sí" : "Recortar vista: no",
    });
  },

  setActiveViewCropSize: (width, depth) => {
    const w = Math.max(0.5, width);
    const d = Math.max(0.5, depth);
    const crop = get().getActiveViewCrop();
    if (!crop) {
      get().setActiveViewCropEnabled(true);
    }
    const cur = get().getActiveViewCrop();
    if (!cur) return;
    const cx = (cur.minX + cur.maxX) / 2;
    const cy = (cur.minY + cur.maxY) / 2;
    get().setActiveViewCrop(
      normalizeViewCrop({
        ...cur,
        enabled: true,
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minY: cy - d / 2,
        maxY: cy + d / 2,
      }),
    );
  },

  setActiveViewCrop: (crop) => {
    const s = get();
    const view = s.views.find((v) => v.id === s.activeViewId);
    if (!view) return;
    const next = normalizeViewCrop(crop);

    if (view.kind === "camera" && view.cameraId) {
      applyCommand(get, set, new SetCameraCropCommand(view.cameraId, next), "Recorte actualizado");
      return;
    }
    if (s.selectedCameraId && view.kind === "plan") {
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(s.selectedCameraId, next),
        "Recorte de cámara actualizado",
      );
      return;
    }
    set({
      views: s.views.map((v) => (v.id === view.id ? { ...v, crop: next } : v)),
      status: "Recorte de vista actualizado",
    });
  },

  resizeActiveViewCropCorner: (corner, x, y) => {
    const crop = get().getActiveViewCrop();
    if (!crop?.enabled) return;
    get().setActiveViewCrop(resizeViewCropCorner(crop, corner, x, y));
  },

  beginCropDrag: (cameraId, corner) => {
    const s = get();
    const start = beginCornerCropDrag({
      cameraId,
      corner,
      activeViewId: s.activeViewId,
      cameras: s.document.cameras,
      views: s.views,
      selectedCameraId: s.selectedCameraId,
      selectedCropFrameCameraId: s.selectedCropFrameCameraId,
    });
    if (!start) return;
    set(start);
  },

  beginCameraFrameMove: (cameraId, x, y) => {
    const start = beginCameraFrameMoveDrag({
      cameraId,
      x,
      y,
      activeViewId: get().activeViewId,
      cameras: get().document.cameras,
    });
    if (!start) return;
    set(start);
  },

  updateCropDrag: (x, y) => {
    const meta = get().cropDragMeta;
    if (!meta) return;
    set(updateCropDragLive(meta, x, y));
  },

  commitCropDrag: () => {
    const s = get();
    const commit = resolveCropDragCommit(s.cropDragMeta, s.cropDragLive);
    set({ cropDragMeta: null, cropDragLive: null, cameraPoseDragLive: null });
    if (commit.kind === "clear-only") return;
    if (commit.kind === "translate-camera") {
      applyCommand(
        get,
        set,
        new TranslateCameraPlanCommand(commit.cameraId, commit.dx, commit.dy),
        "Cámara movida en planta",
      );
      return;
    }
    if (commit.kind === "set-camera-crop") {
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(commit.cameraId, commit.crop),
        "Recorte redimensionado",
      );
      return;
    }
    set({
      views: get().views.map((v) =>
        v.id === commit.viewId ? { ...v, crop: commit.crop } : v,
      ),
      status: "Recorte de vista redimensionado",
    });
  },

  cancelCropDrag: () => {
    set({
      cropDragMeta: null,
      cropDragLive: null,
      cameraPoseDragLive: null,
      status: "Recorte cancelado",
    });
  },

  setActiveView: (id) => {
    const view = get().views.find((v) => v.id === id);
    if (!view) return;
    set({
      activeViewId: id,
      views: get().views.map((v) => (v.id === id ? { ...v, open: true } : v)),
      selectedCameraId: view.cameraId ?? get().selectedCameraId,
      status:
        view.kind === "plan"
          ? `Vista ortogonal: ${view.name}`
          : view.kind === "camera"
            ? `Vista cámara: ${view.name}`
            : `Vista 3D: ${view.name}`,
    });
  },

  ensureViewOpen: (id) => get().setActiveView(id),

  addView: (kind) => {
    if (kind === "camera") {
      get().setTool("camera");
      const plan = get().views.find((v) => v.kind === "plan");
      if (plan) get().setActiveView(plan.id);
      return;
    }
    const n = get().views.filter((v) => v.kind === kind).length + 1;
    const id = `view.${kind}.${n}`;
    const name = kind === "plan" ? `Planta ${n}` : `3D ${n}`;
    const view: ProjectView = { id, name, kind, open: true };
    set({
      views: [...get().views, view],
      activeViewId: id,
      ribbonTab: "view",
      status: `Vista creada: ${name}`,
    });
  },
});
