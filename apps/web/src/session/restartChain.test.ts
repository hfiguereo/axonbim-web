import { describe, expect, it } from "vitest";
import { useSessionStore } from "./createSessionStore";

describe("LR1-B restartChainAt", () => {
  it("restarts chain at point without mutating document or history", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    expect(useSessionStore.getState().document.walls).toHaveLength(1);
    const canUndo = useSessionStore.getState().history.canUndo;
    expect(canUndo).toBe(true);

    // After chain place, pending is at P2 (4,0); hover along +X to engage ortho lock.
    useSessionStore.getState().setWallHover({ x: 8, y: 0.2, z: 0 });
    expect(useSessionStore.getState().snapSession.axisLock).toBe("horizontal");

    useSessionStore.getState().restartChainAt({ x: 10, y: 10, z: 0 });

    const s = useSessionStore.getState();
    expect(s.activeTool).toBe("wall");
    expect(s.wallChain).toBe(true);
    expect(s.wallPending).toEqual({ x: 10, y: 10, z: 0 });
    expect(s.wallChainOrigin).toEqual({ x: 10, y: 10, z: 0 });
    expect(s.snapSession.axisLock).toBe("none");
    expect(s.document.walls).toHaveLength(1);
    expect(s.history.canUndo).toBe(canUndo);
  });

  it("no-ops when wall tool is not active", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("none");
    useSessionStore.getState().restartChainAt({ x: 1, y: 1, z: 0 });
    expect(useSessionStore.getState().wallPending).toBeNull();
  });
});
