import { useSessionStore } from "../sessionStore";

export function StatusBar() {
  const status = useSessionStore((s) => s.status);
  const tool = useSessionStore((s) => s.activeTool);
  const walls = useSessionStore((s) => s.document.walls.length);

  return (
    <footer className="statusbar">
      <span className="statusbar__msg">{status}</span>
      <span className="statusbar__meta">
        tool:{tool} · walls:{walls} · u:m · snaps:stub
      </span>
    </footer>
  );
}
