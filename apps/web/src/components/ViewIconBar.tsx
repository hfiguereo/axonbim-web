import { useSessionStore } from "../sessionStore";

function IconFit() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconScale() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3 13L13 3M5 13H3v-2M11 3h2v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Thin icon strip under the canvas — leftmost = fit. */
export function ViewIconBar() {
  const graphicScale = useSessionStore((s) => s.graphicScale);
  const visualStyle = useSessionStore((s) => s.visualStyle);
  const detailLevel = useSessionStore((s) => s.detailLevel);
  const orbitPivotMode = useSessionStore((s) => s.orbitPivotMode);
  const cycleGraphicScale = useSessionStore((s) => s.cycleGraphicScale);
  const cycleVisualStyle = useSessionStore((s) => s.cycleVisualStyle);
  const cycleDetailLevel = useSessionStore((s) => s.cycleDetailLevel);
  const requestFitView = useSessionStore((s) => s.requestFitView);
  const setOrbitPivotMode = useSessionStore((s) => s.setOrbitPivotMode);
  const setStatus = useSessionStore((s) => s.setStatus);

  const styleGlyph =
    visualStyle === "wireframe" ? "⬚" : visualStyle === "hiddenLine" ? "▣" : "◼";
  const detailGlyph =
    detailLevel === "coarse" ? "·" : detailLevel === "medium" ? ":" : "⋮";

  return (
    <div className="icon-bar" aria-label="Controles de vista">
      <button
        type="button"
        className="icon-bar__btn icon-bar__btn--fit"
        title="Ajustar modelo a vista"
        aria-label="Ajustar a vista"
        onClick={() => {
          requestFitView();
          setStatus("Vista ajustada al modelo");
        }}
      >
        <IconFit />
        <span className="icon-bar__mini">Fit</span>
      </button>
      <button
        type="button"
        className={
          orbitPivotMode === "selection"
            ? "icon-bar__btn icon-bar__btn--on"
            : "icon-bar__btn"
        }
        title={
          orbitPivotMode === "selection"
            ? "Órbita: pivot en selección (clic para modelo)"
            : "Órbita: pivot en modelo (clic para selección)"
        }
        aria-label="Modo pivot de órbita"
        aria-pressed={orbitPivotMode === "selection"}
        onClick={() =>
          setOrbitPivotMode(orbitPivotMode === "model" ? "selection" : "model")
        }
      >
        <span className="icon-bar__glyph">{orbitPivotMode === "selection" ? "◎" : "◉"}</span>
        <span className="icon-bar__mini">
          {orbitPivotMode === "selection" ? "Sel" : "Mod"}
        </span>
      </button>
      <button
        type="button"
        className="icon-bar__btn"
        title={`Escala ${graphicScale}`}
        onClick={cycleGraphicScale}
      >
        <IconScale />
        <span className="icon-bar__mini">{graphicScale}</span>
      </button>
      <button
        type="button"
        className="icon-bar__btn"
        title={`Estilo: ${visualStyle}`}
        onClick={cycleVisualStyle}
      >
        <span className="icon-bar__glyph">{styleGlyph}</span>
      </button>
      <button
        type="button"
        className="icon-bar__btn"
        title={`Detalle: ${detailLevel}`}
        onClick={cycleDetailLevel}
      >
        <span className="icon-bar__glyph">{detailGlyph}</span>
      </button>
      <button
        type="button"
        className="icon-bar__btn"
        title="Render (futuro)"
        onClick={() => setStatus("Render: pendiente")}
      >
        <span className="icon-bar__glyph">☀</span>
      </button>
    </div>
  );
}
