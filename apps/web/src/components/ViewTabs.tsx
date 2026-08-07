import { useSessionStore } from "../sessionStore";

export function ViewTabs() {
  const views = useSessionStore((s) => s.views);
  const activeViewId = useSessionStore((s) => s.activeViewId);
  const setActiveView = useSessionStore((s) => s.setActiveView);
  const openViews = views.filter((v) => v.open);

  return (
    <div className="view-tabs" role="tablist" aria-label="Vistas abiertas">
      {openViews.map((v) => (
        <button
          key={v.id}
          type="button"
          role="tab"
          className={
            v.id === activeViewId ? "view-tabs__tab view-tabs__tab--active" : "view-tabs__tab"
          }
          onClick={() => setActiveView(v.id)}
        >
          {v.name}
        </button>
      ))}
    </div>
  );
}
