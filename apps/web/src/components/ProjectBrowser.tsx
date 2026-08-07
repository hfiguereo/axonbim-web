import { FloatingPanel } from "./FloatingPanel";
import { useSessionStore } from "../sessionStore";

export function ProjectBrowser({ flexGrow = 1 }: { flexGrow?: number }) {
  const views = useSessionStore((s) => s.views);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const setActiveView = useSessionStore((s) => s.setActiveView);
  const storeys = useSessionStore((s) => s.document.storeys);
  const families = useSessionStore((s) => s.document.families);
  const dock = useSessionStore((s) => s.browserDock);
  const floatPos = useSessionStore((s) => s.browserFloat);
  const visible = useSessionStore((s) => s.browserVisible);

  const plans = views.filter((v) => v.kind === "plan");
  const threes = views.filter((v) => v.kind === "perspective");

  return (
    <FloatingPanel
      panelId="browser"
      title="Navegador de proyecto"
      dock={dock}
      floatPos={floatPos}
      visible={visible}
      flexGrow={flexGrow}
      className="float-panel--browser"
    >
      <div className="dock__tabs" aria-hidden>
        <span className="dock__mini-tab dock__mini-tab--on">Views</span>
        <span className="dock__mini-tab">Sheets</span>
        <span className="dock__mini-tab">Families</span>
      </div>
      <div className="tree">
        <div className="tree__node tree__node--branch">▼ Views</div>
        <div className="tree__node tree__node--branch tree__indent">▼ Floor Plans</div>
        {plans.map((v) => (
          <button
            key={v.id}
            type="button"
            className={
              v.id === activeViewId
                ? "tree__item tree__indent-2 tree__item--active"
                : "tree__item tree__indent-2"
            }
            onClick={() => setActiveView(v.id)}
          >
            {v.name}
          </button>
        ))}
        <div className="tree__node tree__node--branch tree__indent">▼ 3D Views</div>
        {threes.map((v) => (
          <button
            key={v.id}
            type="button"
            className={
              v.id === activeViewId
                ? "tree__item tree__indent-2 tree__item--active"
                : "tree__item tree__indent-2"
            }
            onClick={() => setActiveView(v.id)}
          >
            {v.name}
          </button>
        ))}
        <div className="tree__node tree__node--branch">▼ Niveles</div>
        {storeys.map((s) => (
          <div key={s.id} className="tree__item tree__indent tree__item--mute">
            {s.name}
          </div>
        ))}
        <div className="tree__node tree__node--branch">▼ Families</div>
        {families.map((f) => (
          <div key={f.id} className="tree__item tree__indent tree__item--mute">
            {f.label}
          </div>
        ))}
      </div>
    </FloatingPanel>
  );
}
