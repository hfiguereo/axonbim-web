import { createViewport, type ViewportHandle } from "@axonbim/viewer";
import { useEffect, useRef } from "react";
import { useSessionStore } from "../sessionStore";

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<ViewportHandle | null>(null);
  const fitViewRequest = useSessionStore((s) => s.fitViewRequest);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const activeViewKind = useSessionStore(
    (s) => s.views.find((v) => v.id === s.activeViewId)?.kind,
  );
  const visualStyle = useSessionStore((s) => s.visualStyle);

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
    handleRef.current?.setProjection(mode);
    handleRef.current?.fitEmpty();
  }, [fitViewRequest, activeViewId, activeViewKind]);

  return (
    <div className="viewport" ref={hostRef}>
      <canvas ref={canvasRef} className="viewport__canvas" />
      <div className="viewport__hint" aria-hidden>
        {activeViewKind === "plan" ? "planta ortogonal" : "perspectiva"} · {visualStyle}
      </div>
    </div>
  );
}
