import { useSessionStore } from "../sessionStore";

export function StatusBar() {
  const status = useSessionStore((s) => s.status);
  const tool = useSessionStore((s) => s.activeTool);
  const walls = useSessionStore((s) => s.document.walls.length);
  const snap = useSessionStore((s) => s.lastSnapKind);
  const snapEnabled = useSessionStore((s) => s.snapEnabled);
  const setSnapEnabled = useSessionStore((s) => s.setSnapEnabled);

  return (
    <footer className="statusbar">
      <span className="statusbar__msg">{status}</span>
      <div className="statusbar__right">
        <label className="statusbar__switch" title="Snap: extremos, ortogonal y cierre">
          <span>Snap</span>
          <button
            type="button"
            role="switch"
            aria-checked={snapEnabled}
            className={snapEnabled ? "switch switch--on" : "switch"}
            onClick={() => setSnapEnabled(!snapEnabled)}
          >
            <span className="switch__knob" />
          </button>
        </label>
        <span className="statusbar__meta">
          tool:{tool} · walls:{walls} · snap:{snapEnabled ? snap : "off"}
        </span>
      </div>
    </footer>
  );
}
