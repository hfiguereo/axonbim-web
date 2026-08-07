import { useSessionStore } from "../sessionStore";

/** Thin icon strip — scale, visual style, detail, future render only. */
export function ViewIconBar() {
  const graphicScale = useSessionStore((s) => s.graphicScale);
  const visualStyle = useSessionStore((s) => s.visualStyle);
  const detailLevel = useSessionStore((s) => s.detailLevel);
  const cycleGraphicScale = useSessionStore((s) => s.cycleGraphicScale);
  const cycleVisualStyle = useSessionStore((s) => s.cycleVisualStyle);
  const cycleDetailLevel = useSessionStore((s) => s.cycleDetailLevel);
  const setStatus = useSessionStore((s) => s.setStatus);

  const styleGlyph =
    visualStyle === "wireframe" ? "⬚" : visualStyle === "hiddenLine" ? "▣" : "◼";
  const detailGlyph =
    detailLevel === "coarse" ? "·" : detailLevel === "medium" ? ":" : "⋮";

  return (
    <div className="icon-bar" aria-label="Controles de vista">
      <button
        type="button"
        className="icon-bar__btn"
        title={`Escala ${graphicScale}`}
        onClick={cycleGraphicScale}
      >
        <span className="icon-bar__glyph">⤢</span>
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
