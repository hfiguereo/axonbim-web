import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useSessionStore } from "./sessionStore";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

/** Narrow test hooks for Playwright (non-production only). */
if (import.meta.env.MODE !== "production") {
  type E2EApi = {
    firstWallId: () => string | null;
    selectWall: (id: string) => void;
    deleteSelectedWall: () => void;
    wallCount: () => number;
    doorCount: () => number;
    windowCount: () => number;
    cameraCount: () => number;
    /** Place door at midspan of wall (default: first wall). */
    placeDoorOnWall: (wallId?: string) => void;
    /** Place window at midspan of wall (default: second wall, else first). */
    placeWindowOnWall: (wallId?: string) => void;
    /** Two-click camera: eye then look-at (world XY, z ignored). */
    placeCamera: (eye: { x: number; y: number }, target: { x: number; y: number }) => void;
    undo: () => void;
  };

  const wallMid = (wallId: string) => {
    const wall = useSessionStore.getState().document.walls.find((w) => w.id === wallId);
    if (!wall) return null;
    return {
      x: (wall.p1.x + wall.p2.x) / 2,
      y: (wall.p1.y + wall.p2.y) / 2,
    };
  };

  (window as unknown as { __AXON_E2E__: E2EApi }).__AXON_E2E__ = {
    firstWallId: () => useSessionStore.getState().document.walls[0]?.id ?? null,
    selectWall: (id) => useSessionStore.getState().setSelectedWallId(id),
    deleteSelectedWall: () => useSessionStore.getState().deleteSelectedWall(),
    wallCount: () => useSessionStore.getState().document.walls.length,
    doorCount: () => useSessionStore.getState().document.doors.length,
    windowCount: () => useSessionStore.getState().document.windows.length,
    cameraCount: () => useSessionStore.getState().document.cameras.length,
    placeDoorOnWall: (wallId) => {
      const id = wallId ?? useSessionStore.getState().document.walls[0]?.id;
      if (!id) throw new Error("no walls");
      const mid = wallMid(id);
      if (!mid) throw new Error("wall missing");
      useSessionStore.getState().placeDoorOnWall(id, mid);
    },
    placeWindowOnWall: (wallId) => {
      const walls = useSessionStore.getState().document.walls;
      const id = wallId ?? walls[1]?.id ?? walls[0]?.id;
      if (!id) throw new Error("no walls");
      const mid = wallMid(id);
      if (!mid) throw new Error("wall missing");
      useSessionStore.getState().placeWindowOnWall(id, mid);
    },
    placeCamera: (eye, target) => {
      const s = useSessionStore.getState();
      s.setTool("camera");
      s.cameraClick({ x: eye.x, y: eye.y, z: 0 });
      s.cameraClick({ x: target.x, y: target.y, z: 0 });
    },
    undo: () => useSessionStore.getState().runUndo(),
  };
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
