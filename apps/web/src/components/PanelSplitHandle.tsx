import { useEffect, useRef, type PointerEvent } from "react";
import { useSessionStore } from "../sessionStore";

/** Horizontal splitter between stacked dock panels (changes height share). */
export function PanelSplitHandle({ side }: { side: "left" | "right" }) {
  const split = useSessionStore((s) =>
    side === "left" ? s.leftDockSplit : s.rightDockSplit,
  );
  const setSplit = useSessionStore((s) =>
    side === "left" ? s.setLeftDockSplit : s.setRightDockSplit,
  );
  const drag = useRef<{ startY: number; startSplit: number; colH: number } | null>(
    null,
  );

  useEffect(() => {
    const onMove = (e: globalThis.PointerEvent) => {
      if (!drag.current) return;
      const dy = e.clientY - drag.current.startY;
      const delta = dy / drag.current.colH;
      setSplit(drag.current.startSplit + delta);
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
  }, [setSplit]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const col = (e.currentTarget.parentElement as HTMLElement | null)?.closest(
      ".dock-column__stack",
    );
    const colH = col?.getBoundingClientRect().height ?? 400;
    drag.current = { startY: e.clientY, startSplit: split, colH };
  };

  return (
    <div
      className="panel-split"
      onPointerDown={onDown}
      role="separator"
      aria-orientation="horizontal"
      aria-label="Alto entre paneles"
      title="Arrastra para cambiar la altura de los paneles"
    />
  );
}
