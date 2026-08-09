import { describe, expect, it } from "vitest";
import { useSessionStore } from "./createSessionStore";

describe("LR1 SnapSession in session store", () => {
  it("clears SnapSession on Escape (cancelWallDraw)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().setWallHover({ x: 5, y: 0.3, z: 0 });
    expect(useSessionStore.getState().snapSession.axisLock).toBe("horizontal");
    expect(useSessionStore.getState().lastSnapKind).toBe("ortho");

    useSessionStore.getState().cancelWallDraw();
    expect(useSessionStore.getState().snapSession.axisLock).toBe("none");
    expect(useSessionStore.getState().wallPending).toBeNull();
  });

  it("clears SnapSession when leaving wall tool", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().setWallHover({ x: 5, y: 0.2, z: 0 });
    expect(useSessionStore.getState().snapSession.axisLock).toBe("horizontal");

    useSessionStore.getState().setTool("none");
    expect(useSessionStore.getState().snapSession.axisLock).toBe("none");
  });

  it("Undo/Redo does not persist SnapSession in the document", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    expect(useSessionStore.getState().document.walls).toHaveLength(1);

    useSessionStore.getState().setWallHover({ x: 4, y: 0, z: 0 });
    useSessionStore.getState().setWallHover({ x: 8, y: 0.4, z: 0 });
    expect(useSessionStore.getState().snapSession.axisLock).toBe("horizontal");

    const docBefore = useSessionStore.getState().document;
    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.walls).toHaveLength(0);
    // SnapSession is session UI state — not restored from history into the document.
    expect(useSessionStore.getState().document).not.toHaveProperty("snapSession");
    expect(docBefore).not.toHaveProperty("snapSession");

    useSessionStore.getState().runRedo();
    expect(useSessionStore.getState().document.walls).toHaveLength(1);
    expect(useSessionStore.getState().document).not.toHaveProperty("snapSession");
  });
});
