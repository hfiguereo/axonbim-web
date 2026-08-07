import { useSessionStore } from "../sessionStore";

/**
 * Maqueta Blender-like orientation gizmo (top-right of 3D view).
 * Visual stub only — real camera orbits / ortho presets = etapa futura.
 */
export function ViewOrientationGizmo({ visible }: { visible: boolean }) {
  const setStatus = useSessionStore((s) => s.setStatus);
  if (!visible) return null;

  const stub = (label: string) => {
    setStatus(`Gizmo ${label}: maqueta — orientación real en etapa futura`);
  };

  return (
    <div className="view-gizmo" aria-label="Orientación de vista (maqueta)" title="Gizmo de vista — maqueta">
      <div className="view-gizmo__axes" aria-hidden>
        <button type="button" className="view-gizmo__axis view-gizmo__axis--x" onClick={() => stub("X / derecha")}>
          X
        </button>
        <button type="button" className="view-gizmo__axis view-gizmo__axis--y" onClick={() => stub("Y / frente")}>
          Y
        </button>
        <button type="button" className="view-gizmo__axis view-gizmo__axis--z" onClick={() => stub("Z / arriba")}>
          Z
        </button>
        <span className="view-gizmo__hub" />
      </div>
      <div className="view-gizmo__presets">
        <button type="button" className="view-gizmo__chip" onClick={() => stub("planta")}>
          Top
        </button>
        <button type="button" className="view-gizmo__chip" onClick={() => stub("frente")}>
          Front
        </button>
        <button type="button" className="view-gizmo__chip" onClick={() => stub("derecha")}>
          Right
        </button>
        <button type="button" className="view-gizmo__chip" onClick={() => stub("persp")}>
          Persp
        </button>
      </div>
    </div>
  );
}
