import { createViewport, type ViewportHandle } from "@axonbim/viewer";
import { useEffect, useRef } from "react";
import { useSessionStore, type OrbitPivotMode } from "../sessionStore";
import { ViewOrientationGizmo } from "./ViewOrientationGizmo";

function modelPivot(walls: { p1: { x: number; y: number }; p2: { x: number; y: number }; height: number }[]) {
  if (walls.length === 0) return { x: 0, y: 0, z: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let maxH = 0;
  for (const w of walls) {
    minX = Math.min(minX, w.p1.x, w.p2.x);
    maxX = Math.max(maxX, w.p1.x, w.p2.x);
    minY = Math.min(minY, w.p1.y, w.p2.y);
    maxY = Math.max(maxY, w.p1.y, w.p2.y);
    maxH = Math.max(maxH, w.height);
  }
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: maxH * 0.35 };
}

function resolveOrbitPivot(
  mode: OrbitPivotMode,
  state: ReturnType<typeof useSessionStore.getState>,
): { x: number; y: number; z: number } {
  const { document: doc, selectedWallId, selectedDoorId, selectedWindowId } = state;
  const fallback = modelPivot(doc.walls);

  if (mode !== "selection") return fallback;

  if (selectedWallId) {
    const w = doc.walls.find((x) => x.id === selectedWallId);
    if (w) {
      return {
        x: (w.p1.x + w.p2.x) / 2,
        y: (w.p1.y + w.p2.y) / 2,
        z: w.height * 0.5,
      };
    }
  }
  if (selectedDoorId) {
    const d = doc.doors.find((x) => x.id === selectedDoorId);
    const host = d ? doc.walls.find((w) => w.id === d.wallId) : undefined;
    if (d && host) {
      const len = Math.hypot(host.p2.x - host.p1.x, host.p2.y - host.p1.y) || 1;
      const t = Math.min(1, Math.max(0, d.centerOffset / len));
      return {
        x: host.p1.x + (host.p2.x - host.p1.x) * t,
        y: host.p1.y + (host.p2.y - host.p1.y) * t,
        z: d.sill + d.height * 0.5,
      };
    }
  }
  if (selectedWindowId) {
    const win = doc.windows.find((x) => x.id === selectedWindowId);
    const host = win ? doc.walls.find((w) => w.id === win.wallId) : undefined;
    if (win && host) {
      const len = Math.hypot(host.p2.x - host.p1.x, host.p2.y - host.p1.y) || 1;
      const t = Math.min(1, Math.max(0, win.centerOffset / len));
      return {
        x: host.p1.x + (host.p2.x - host.p1.x) * t,
        y: host.p1.y + (host.p2.y - host.p1.y) * t,
        z: win.sill + win.height * 0.5,
      };
    }
  }
  return fallback;
}

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ViewportHandle | null>(null);

  const fitViewRequest = useSessionStore((s) => s.fitViewRequest);
  const cameraPresetRequest = useSessionStore((s) => s.cameraPresetRequest);
  const cameraPreset = useSessionStore((s) => s.cameraPreset);
  const orbitPivotRequest = useSessionStore((s) => s.orbitPivotRequest);
  const orbitPivotMode = useSessionStore((s) => s.orbitPivotMode);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const activeViewKind = useSessionStore(
    (s) => s.views.find((v) => v.id === s.activeViewId)?.kind,
  );
  const visualStyle = useSessionStore((s) => s.visualStyle);
  const documentRev = useSessionStore((s) => s.documentRev);
  const walls = useSessionStore((s) => s.document.walls);
  const doors = useSessionStore((s) => s.document.doors);
  const windows = useSessionStore((s) => s.document.windows);
  const selectedWallId = useSessionStore((s) => s.selectedWallId);
  const selectedDoorId = useSessionStore((s) => s.selectedDoorId);
  const selectedWindowId = useSessionStore((s) => s.selectedWindowId);
  const selectedCameraId = useSessionStore((s) => s.selectedCameraId);
  const selectedCropFrameCameraId = useSessionStore((s) => s.selectedCropFrameCameraId);
  const cameras = useSessionStore((s) => s.document.cameras);
  const views = useSessionStore((s) => s.views);
  const cropDragLive = useSessionStore((s) => s.cropDragLive);
  const cropDragMeta = useSessionStore((s) => s.cropDragMeta);
  const cameraPoseDragLive = useSessionStore((s) => s.cameraPoseDragLive);
  const activeTool = useSessionStore((s) => s.activeTool);
  const wallPending = useSessionStore((s) => s.wallPending);
  const wallHover = useSessionStore((s) => s.wallHover);
  const lastSnapKind = useSessionStore((s) => s.lastSnapKind);
  const elevation = useSessionStore((s) => s.document.storeys[0]?.elevation ?? 0);
  const activeCameraEntity = useSessionStore((s) => {
    const v = s.views.find((x) => x.id === s.activeViewId);
    if (v?.kind !== "camera" || !v.cameraId) return null;
    return s.document.cameras.find((c) => c.id === v.cameraId) ?? null;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const viewport = createViewport({
      canvas,
      projection: activeViewKind === "plan" ? "plan" : "perspective",
    });
    handleRef.current = viewport;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      viewport.resize(entry.contentRect.width, entry.contentRect.height);
    });
    ro.observe(host);

    return () => {
      ro.disconnect();
      handleRef.current = null;
      viewport.dispose();
    };
    // Mount once; projection updates via setProjection below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const mode = activeViewKind === "plan" ? "plan" : "perspective";
    const vp = handleRef.current;
    if (!vp) return;
    vp.setProjection(mode);
    if (activeViewKind === "camera" && activeCameraEntity) {
      vp.applyModelCamera(activeCameraEntity);
      return;
    }
    const { walls: w } = useSessionStore.getState().document;
    if (w.length) vp.fitWalls(w);
    else vp.fitEmpty();
  }, [fitViewRequest, activeViewId, activeViewKind, activeCameraEntity]);

  useEffect(() => {
    if (!cameraPreset || cameraPresetRequest <= 0) return;
    if (activeViewKind === "camera") return;
    handleRef.current?.setCameraPreset(cameraPreset);
  }, [cameraPresetRequest, cameraPreset, activeViewKind]);

  useEffect(() => {
    if (activeViewKind === "plan" || activeViewKind === "camera") return;
    const vp = handleRef.current;
    if (!vp) return;
    const pivot = resolveOrbitPivot(orbitPivotMode, useSessionStore.getState());
    vp.setOrbitPivot(pivot);
  }, [
    orbitPivotRequest,
    orbitPivotMode,
    activeViewKind,
    documentRev,
    selectedWallId,
    selectedDoorId,
    selectedWindowId,
  ]);

  useEffect(() => {
    if (activeViewKind !== "camera" || !activeCameraEntity) return;
    handleRef.current?.applyModelCamera(activeCameraEntity);
  }, [activeViewKind, activeCameraEntity, documentRev]);

  useEffect(() => {
    const camerasForSync = cameras.map((c) => {
      let next = c;
      if (cropDragMeta?.cameraId === c.id && cropDragLive) {
        next = { ...next, crop: cropDragLive };
      }
      if (cameraPoseDragLive?.cameraId === c.id) {
        next = {
          ...next,
          eye: { ...cameraPoseDragLive.eye },
          target: { ...cameraPoseDragLive.target },
        };
      }
      return next;
    });
    const activeView = views.find((v) => v.id === activeViewId);
    let sessionCrop = activeView?.kind !== "camera" ? (activeView?.crop ?? null) : null;
    if (cropDragMeta && !cropDragMeta.cameraId && cropDragLive) {
      sessionCrop = cropDragLive;
    }
    handleRef.current?.syncWalls(
      walls,
      doors,
      windows,
      camerasForSync,
      selectedWallId,
      selectedDoorId,
      selectedWindowId,
      selectedCameraId,
      sessionCrop,
      selectedCropFrameCameraId,
    );
  }, [
    documentRev,
    walls,
    doors,
    windows,
    cameras,
    views,
    activeViewId,
    selectedWallId,
    selectedDoorId,
    selectedWindowId,
    selectedCameraId,
    selectedCropFrameCameraId,
    cropDragLive,
    cropDragMeta,
    cameraPoseDragLive,
  ]);

  useEffect(() => {
    const s = useSessionStore.getState();
    const vp = handleRef.current;
    if (!vp) return;
    const crop = s.getClippingCrop();
    vp.setClippingCrop(crop?.enabled ? crop : null);
  }, [
    activeViewKind,
    documentRev,
    cameras,
    views,
    activeViewId,
    selectedCameraId,
    cropDragLive,
  ]);

  // Screen frame = view-limit overlay (camera / free 3D), never on plan
  const showCropFrame = useSessionStore((s) => {
    void s.documentRev;
    void s.views;
    void s.activeViewId;
    void s.cropDragLive;
    void s.cropDragMeta;
    if (s.views.find((v) => v.id === s.activeViewId)?.kind === "plan") return false;
    return s.getClippingCrop()?.enabled ?? false;
  });

  useEffect(() => {
    handleRef.current?.setPreviewSegment(wallPending, wallHover);
    if (activeTool === "wall" && wallHover) {
      handleRef.current?.setSnapCue(wallHover, lastSnapKind, wallPending);
    } else {
      handleRef.current?.setSnapCue(null, "none", null);
    }
  }, [wallPending, wallHover, lastSnapKind, activeTool]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let cropDragging = false;

    const onPointerMove = (e: PointerEvent) => {
      const s = useSessionStore.getState();
      if (cropDragging || s.cropDragMeta) {
        const p = handleRef.current?.pickGround(e.clientX, e.clientY, elevation);
        if (p) s.updateCropDrag(p.x, p.y);
        return;
      }
      if (s.activeTool !== "wall" && s.activeTool !== "camera") return;
      const p = handleRef.current?.pickGround(e.clientX, e.clientY, elevation);
      if (p) s.setWallHover(p, e.shiftKey);
    };

    const onPointerUp = () => {
      if (!cropDragging && !useSessionStore.getState().cropDragMeta) return;
      cropDragging = false;
      useSessionStore.getState().commitCropDrag();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const s = useSessionStore.getState();
      const vp = handleRef.current;
      if (!vp) return;

      if (s.activeTool === "wall") {
        const p = vp.pickGround(e.clientX, e.clientY, elevation);
        if (p) s.wallClick(p, e.shiftKey);
        return;
      }

      if (s.activeTool === "camera") {
        const p = vp.pickGround(e.clientX, e.clientY, elevation);
        if (p) s.cameraClick(p);
        return;
      }

      if (s.activeTool === "door") {
        const wallId = vp.pickWallId(e.clientX, e.clientY);
        if (!wallId) {
          s.setStatus("Clic en un muro para colocar la puerta");
          return;
        }
        const p = vp.pickGround(e.clientX, e.clientY, elevation);
        if (p) s.placeDoorOnWall(wallId, p);
        return;
      }

      if (s.activeTool === "window") {
        const wallId = vp.pickWallId(e.clientX, e.clientY);
        if (!wallId) {
          s.setStatus("Clic en un muro para colocar la ventana");
          return;
        }
        const p = vp.pickGround(e.clientX, e.clientY, elevation);
        if (p) s.placeWindowOnWall(wallId, p);
        return;
      }

      const cropGrip = vp.pickCropGrip(e.clientX, e.clientY);
      if (cropGrip) {
        cropDragging = true;
        if (cropGrip.cameraId) {
          s.setSelectedCropFrameCameraId(cropGrip.cameraId);
        }
        s.beginCropDrag(cropGrip.cameraId, cropGrip.corner);
        host.setPointerCapture?.(e.pointerId);
        return;
      }

      const cropFrame = vp.pickCropFrame(e.clientX, e.clientY);
      if (cropFrame) {
        const already = s.selectedCropFrameCameraId === cropFrame.cameraId;
        s.setSelectedCropFrameCameraId(cropFrame.cameraId);
        if (already) {
          const p = vp.pickGround(e.clientX, e.clientY, elevation);
          if (p) {
            cropDragging = true;
            s.beginCameraFrameMove(cropFrame.cameraId, p.x, p.y);
            host.setPointerCapture?.(e.pointerId);
          }
        }
        return;
      }

      const flip = vp.pickFlipControl(e.clientX, e.clientY);
      if (flip?.entityType === "door") {
        s.setSelectedDoorId(flip.entityId);
        if (flip.kind === "swing") s.flipSelectedDoorSwing();
        else s.flipSelectedDoorHinge();
        return;
      }
      if (flip?.entityType === "window") {
        s.setSelectedWindowId(flip.entityId);
        if (flip.kind === "swing") s.flipSelectedWindowSwing();
        else s.flipSelectedWindowHinge();
        return;
      }

      const cameraId = vp.pickCameraId(e.clientX, e.clientY);
      if (cameraId) {
        s.setSelectedCameraId(cameraId);
        return;
      }
      const windowId = vp.pickWindowId(e.clientX, e.clientY);
      if (windowId) {
        s.setSelectedWindowId(windowId);
        return;
      }
      const doorId = vp.pickDoorId(e.clientX, e.clientY);
      if (doorId) {
        s.setSelectedDoorId(doorId);
        return;
      }
      const id = vp.pickWallId(e.clientX, e.clientY);
      s.setSelectedWallId(id);
    };

    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    return () => {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
    };
  }, [elevation]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA")) {
        return;
      }
      const s = useSessionStore.getState();
      if (e.key === "Escape") {
        if (s.cropDragMeta) {
          s.cancelCropDrag();
          return;
        }
        s.cancelWallDraw();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (s.selectedCameraId) {
          e.preventDefault();
          s.deleteSelectedCamera();
          return;
        }
        if (s.selectedDoorId) {
          e.preventDefault();
          s.deleteSelectedDoor();
          return;
        }
        if (s.selectedWindowId) {
          e.preventDefault();
          s.deleteSelectedWindow();
          return;
        }
        if (s.selectedWallId) {
          e.preventDefault();
          s.deleteSelectedWall();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) s.runRedo();
        else s.runUndo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        s.runRedo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const drawing =
    activeTool === "wall" || activeTool === "door" || activeTool === "window";
  const snapLabel =
    lastSnapKind === "endpoint"
      ? "snap extremo"
      : lastSnapKind === "ortho"
        ? "snap orto"
        : lastSnapKind === "close"
          ? "snap cierre"
          : activeTool === "wall"
            ? "sin snap"
            : activeTool === "door"
              ? "clic en muro"
              : activeTool === "window"
                ? "clic en muro"
                : "";

  return (
    <div className={drawing ? "viewport viewport--draw" : "viewport"} ref={hostRef}>
      <canvas ref={canvasRef} className="viewport__canvas" />
      {showCropFrame && (
        <div
          className="viewport__crop-frame"
          aria-hidden
          title="Límite de recorte de vista"
        />
      )}
      <ViewOrientationGizmo
        visible={activeViewKind === "perspective"}
        onOrbit={(dx, dy) => handleRef.current?.orbitByDelta(dx, dy)}
      />
      <div className="viewport__hint" aria-hidden>
        {activeViewKind === "plan"
          ? "planta · rueda zoom · clic medio pan · grips · cámaras"
          : activeViewKind === "camera"
            ? "vista cámara · rueda zoom · medio/der orbitar · marco = recorte"
            : "3D · rueda zoom · medio/der orbitar · gizmo ejes = vistas · hold = órbita · hub = iso"}
        {" · "}
        {visualStyle}
        {drawing ? ` · muro · ${snapLabel}` : snapLabel ? ` · ${snapLabel}` : ""}
      </div>
    </div>
  );
}
