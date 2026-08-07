import { useEffect, useRef, type PointerEvent } from "react";
import { useSessionStore } from "../sessionStore";

/** Drag the dock column edge to change width (horizontal). */
export function DockResizeHandle({ side }: { side: "left" | "right" }) {
  const setLeft = useSessionStore((s) => s.setLeftDockWidth);
  const setRight = useSessionStore((s) => s.setRightDockWidth);
  const leftW = useSessionStore((s) => s.leftDockWidth);
  const rightW = useSessionStore((s) => s.rightDockWidth);
  const drag = useRef<{ startX: number; startW: number } | null>(null);

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.startX;
      if (side === "left") setLeft(drag.current.startW + dx);
      else setRight(drag.current.startW - dx);
    };
    const onUp = () => {
      drag.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [setLeft, setRight, side]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    drag.current = {
      startX: e.clientX,
      startW: side === "left" ? leftW : rightW,
    };
  };

  return (
    <div
      className={`dock-resize dock-resize--${side}`}
      onPointerDown={onDown}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Ancho del acople ${side}`}
      title="Arrastra para cambiar el ancho"
    />
  );
}
