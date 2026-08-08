import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import type { DockSide, FloatPos, PanelId } from "../session/sessionTypes";
import { useSessionStore } from "../sessionStore";

type FloatingPanelProps = {
  panelId: PanelId;
  title: string;
  dock: DockSide;
  floatPos: FloatPos;
  visible: boolean;
  children: ReactNode;
  className?: string;
  /** Flex share when stacked in a dock column */
  flexGrow?: number;
};

const LIFT_PX = 6;

function edgeZonePx(workspaceWidth: number) {
  return Math.min(140, Math.max(88, workspaceWidth * 0.14));
}

function sideFromPointer(
  clientX: number,
  rect: DOMRect,
  ctrlKey: boolean,
): DockSide {
  if (ctrlKey) return "float";
  const zone = edgeZonePx(rect.width);
  if (clientX - rect.left < zone) return "left";
  if (rect.right - clientX < zone) return "right";
  return "float";
}

/**
 * Dockable palette — left and right columns, or float over the workspace.
 */
export function FloatingPanel({
  panelId,
  title,
  dock,
  floatPos,
  visible,
  children,
  className = "",
  flexGrow = 1,
}: FloatingPanelProps) {
  const setPanelDock = useSessionStore((s) => s.setPanelDock);
  const setPanelFloat = useSessionStore((s) => s.setPanelFloat);
  const setPanelVisible = useSessionStore((s) => s.setPanelVisible);
  const setDockPreview = useSessionStore((s) => s.setDockPreview);
  const setDraggingPanel = useSessionStore((s) => s.setDraggingPanel);
  const setStatus = useSessionStore((s) => s.setStatus);

  const dragRef = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
    startDock: DockSide;
    lifted: boolean;
  } | null>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;

      const dx = e.clientX - d.ox;
      const dy = e.clientY - d.oy;

      if (!d.lifted && Math.hypot(dx, dy) >= LIFT_PX) {
        d.lifted = true;
      }

      if (d.startDock !== "float") {
        const el = panelRef.current;
        if (el && d.lifted) {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          el.style.zIndex = "50";
          el.style.boxShadow = "0 12px 36px rgb(0 0 0 / 45%)";
        }
      } else {
        setPanelFloat(panelId, {
          x: Math.max(0, d.sx + dx),
          y: Math.max(0, d.sy + dy),
        });
      }

      const workspace = document.querySelector(".shell__workspace");
      if (!workspace) return;
      const rect = workspace.getBoundingClientRect();
      setDockPreview(sideFromPointer(e.clientX, rect, e.ctrlKey));
    };

    const onUp = (e: globalThis.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      setDraggingPanel(null);

      const el = panelRef.current;
      if (el) {
        el.style.transform = "";
        el.style.zIndex = "";
        el.style.boxShadow = "";
      }

      const workspace = document.querySelector(".shell__workspace");
      const rect = workspace?.getBoundingClientRect();
      const side: DockSide = rect
        ? sideFromPointer(e.clientX, rect, e.ctrlKey)
        : "float";

      if (side === "float" && rect) {
        const originX = rect.left;
        const originY = rect.top;
        if (d.startDock !== "float") {
          setPanelFloat(panelId, {
            x: Math.max(8, e.clientX - originX - 80),
            y: Math.max(8, e.clientY - originY - 12),
          });
        } else {
          setPanelFloat(panelId, {
            x: Math.max(0, d.sx + (e.clientX - d.ox)),
            y: Math.max(0, d.sy + (e.clientY - d.oy)),
          });
        }
      }

      setPanelDock(panelId, side);
      setDockPreview(null);
      setStatus(
        side === "float"
          ? `${title}: flotante — suelta en el borde izq./der. para acoplar`
          : `${title}: acoplado a la ${side === "left" ? "izquierda" : "derecha"}`,
      );
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [
    panelId,
    setDockPreview,
    setDraggingPanel,
    setPanelDock,
    setPanelFloat,
    setStatus,
    title,
  ]);

  if (!visible) return null;

  const onTitlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();

    dragRef.current = {
      ox: e.clientX,
      oy: e.clientY,
      sx: floatPos.x,
      sy: floatPos.y,
      startDock: dock,
      lifted: false,
    };
    setDraggingPanel(panelId);
  };

  const dockTo = (side: DockSide) => {
    setPanelDock(panelId, side);
    setStatus(
      side === "float"
        ? `${title}: flotante`
        : `${title}: acoplado a la ${side === "left" ? "izquierda" : "derecha"}`,
    );
  };

  const docked = dock !== "float";
  const modeClass = docked
    ? "float-panel float-panel--docked"
    : "float-panel float-panel--float";

  const style = docked
    ? { flexGrow, flexShrink: 1, flexBasis: 0 }
    : { left: floatPos.x, top: floatPos.y };

  return (
    <aside
      ref={panelRef}
      className={`${modeClass} ${className}`.trim()}
      style={style}
      aria-label={title}
    >
      <div
        className="float-panel__title"
        onPointerDown={onTitlePointerDown}
        title="Arrastrar · soltar en borde izquierdo o derecho"
      >
        <span className="float-panel__name">{title}</span>
        <div className="float-panel__actions">
          <button
            type="button"
            className={
              dock === "left"
                ? "float-panel__btn float-panel__btn--on"
                : "float-panel__btn"
            }
            title="Acoplar a la izquierda"
            onClick={() => dockTo("left")}
          >
            ◧
          </button>
          <button
            type="button"
            className={
              dock === "float"
                ? "float-panel__btn float-panel__btn--on"
                : "float-panel__btn"
            }
            title="Flotar"
            onClick={() => dockTo("float")}
          >
            ▢
          </button>
          <button
            type="button"
            className={
              dock === "right"
                ? "float-panel__btn float-panel__btn--on"
                : "float-panel__btn"
            }
            title="Acoplar a la derecha"
            onClick={() => dockTo("right")}
          >
            ◨
          </button>
          <button
            type="button"
            className="float-panel__btn"
            title="Cerrar"
            onClick={() => setPanelVisible(panelId, false)}
          >
            ×
          </button>
        </div>
      </div>
      <div className="float-panel__body">{children}</div>
    </aside>
  );
}
