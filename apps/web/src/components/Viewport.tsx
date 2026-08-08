import { createViewport, type ViewportHandle } from "@axonbim/viewer";
import { useEffect, useRef } from "react";
import { useSessionStore } from "../sessionStore";
import { ViewOrientationGizmo } from "./ViewOrientationGizmo";

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ViewportHandle | null>(null);

  const fitViewRequest = useSessionStore((s) => s.fitViewRequest);
  const cameraPresetRequest = useSessionStore((s) => s.cameraPresetRequest);
  const cameraPreset = useSessionStore((s) => s.cameraPreset);
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
  const activeTool = useSessionStore((s) => s.activeTool);
  const wallPending = useSessionStore((s) => s.wallPending);
  const wallHover = useSessionStore((s) => s.wallHover);
  const lastSnapKind = useSessionStore((s) => s.lastSnapKind);
  const elevation = useSessionStore((s) => s.document.storeys[0]?.elevation ?? 0);

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
    const { walls: w } = useSessionStore.getState().document;
    if (w.length) vp.fitWalls(w);
    else vp.fitEmpty();
  }, [fitViewRequest, activeViewId, activeViewKind]);

  useEffect(() => {
    if (!cameraPreset || cameraPresetRequest <= 0) return;
    handleRef.current?.setCameraPreset(cameraPreset);
  }, [cameraPresetRequest, cameraPreset]);

  useEffect(() => {
    handleRef.current?.syncWalls(
      walls,
      doors,
      windows,
      selectedWallId,
      selectedDoorId,
      selectedWindowId,
    );
  }, [documentRev, walls, doors, windows, selectedWallId, selectedDoorId, selectedWindowId]);

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

    const onPointerMove = (e: PointerEvent) => {
      const s = useSessionStore.getState();
      if (s.activeTool !== "wall") return;
      const p = handleRef.current?.pickGround(e.clientX, e.clientY, elevation);
      if (p) s.setWallHover(p, e.shiftKey);
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
    return () => {
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
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
        s.cancelWallDraw();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
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
      <ViewOrientationGizmo visible={activeViewKind === "perspective"} />
      <div className="viewport__hint" aria-hidden>
        {activeViewKind === "plan" ? "planta · rueda zoom · clic medio pan · grips puerta" : "3D · rueda zoom · clic medio/der orbitar"}
        {" · "}
        {visualStyle}
        {drawing ? ` · muro · ${snapLabel}` : snapLabel ? ` · ${snapLabel}` : ""}
      </div>
    </div>
  );
}
