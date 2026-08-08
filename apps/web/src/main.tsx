import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { useSessionStore } from "./sessionStore";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root");
}

/** Narrow test hooks for Playwright smoke (non-production only). */
if (import.meta.env.MODE !== "production") {
  (
    window as unknown as {
      __AXON_E2E__: {
        firstWallId: () => string | null;
        selectWall: (id: string) => void;
        deleteSelectedWall: () => void;
        wallCount: () => number;
      };
    }
  ).__AXON_E2E__ = {
    firstWallId: () => useSessionStore.getState().document.walls[0]?.id ?? null,
    selectWall: (id) => useSessionStore.getState().setSelectedWallId(id),
    deleteSelectedWall: () => useSessionStore.getState().deleteSelectedWall(),
    wallCount: () => useSessionStore.getState().document.walls.length,
  };
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
