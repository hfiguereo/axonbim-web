import { useSessionStore } from "../sessionStore";

/** Stub palette — maqueta only. Lives in the left dock column. */
export function SystemBrowserStub() {
  const visible = useSessionStore((s) => s.systemBrowserVisible);
  const setVisible = useSessionStore((s) => s.setSystemBrowserVisible);
  if (!visible) return null;

  return (
    <aside
      className="float-panel float-panel--docked float-panel--stub"
      style={{ flexGrow: 0.35, flexShrink: 1, flexBasis: 0 }}
      aria-label="Explorador de sistema"
    >
      <div className="float-panel__title">
        <span className="float-panel__name">Explorador de sistema</span>
        <button
          type="button"
          className="float-panel__btn"
          onClick={() => setVisible(false)}
          title="Cerrar"
        >
          ×
        </button>
      </div>
      <div className="float-panel__body">
        <p className="stub-note">Maqueta Revit LT — panel stub (fuera de Etapa 0–1).</p>
      </div>
    </aside>
  );
}
