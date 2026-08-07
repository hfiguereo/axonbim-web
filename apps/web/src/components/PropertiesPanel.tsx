import { FloatingPanel } from "./FloatingPanel";
import { useSessionStore } from "../sessionStore";

export function PropertiesPanel({ flexGrow = 1 }: { flexGrow?: number }) {
  const doc = useSessionStore((s) => s.document);
  const activeTool = useSessionStore((s) => s.activeTool);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const views = useSessionStore((s) => s.views);
  const graphicScale = useSessionStore((s) => s.graphicScale);
  const visualStyle = useSessionStore((s) => s.visualStyle);
  const dock = useSessionStore((s) => s.propertiesDock);
  const floatPos = useSessionStore((s) => s.propertiesFloat);
  const visible = useSessionStore((s) => s.propertiesVisible);
  const view = views.find((v) => v.id === activeViewId);

  return (
    <FloatingPanel
      panelId="properties"
      title="Propiedades"
      dock={dock}
      floatPos={floatPos}
      visible={visible}
      flexGrow={flexGrow}
      className="float-panel--properties"
    >
      <label className="type-selector">
        <span>Type Selector</span>
        <select disabled value="none">
          <option value="none">
            {activeTool === "wall" ? "family.block-150 (stub)" : "(sin tipo)"}
          </option>
        </select>
      </label>
      <dl className="props">
        <div>
          <dt>Proyecto</dt>
          <dd>{doc.meta.name}</dd>
        </div>
        <div>
          <dt>Vista</dt>
          <dd>{view?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Proyección</dt>
          <dd>{view?.kind === "plan" ? "Ortogonal" : "Perspectiva"}</dd>
        </div>
        <div>
          <dt>Escala</dt>
          <dd>{graphicScale}</dd>
        </div>
        <div>
          <dt>Estilo</dt>
          <dd>{visualStyle}</dd>
        </div>
        <div>
          <dt>Muros</dt>
          <dd>{doc.walls.length}</dd>
        </div>
      </dl>
    </FloatingPanel>
  );
}
