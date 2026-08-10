import { describe, expect, it } from "vitest";
import { useSessionStore } from "./createSessionStore";

describe("SK-v1 sketch mode rectangle", () => {
  it("creates four walls in one undoable history entry", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("rectangle");
    expect(useSessionStore.getState().editingParadigm).toBe("sketch");

    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 3, z: 0 });

    const s = useSessionStore.getState();
    expect(s.document.walls).toHaveLength(4);
    expect(s.history.canUndo).toBe(true);

    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.walls).toHaveLength(0);
    useSessionStore.getState().runRedo();
    expect(useSessionStore.getState().document.walls).toHaveLength(4);
  });

  it("keeps line mode as parametric", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    expect(useSessionStore.getState().editingParadigm).toBe("parametric");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    expect(useSessionStore.getState().document.walls).toHaveLength(1);
  });
});
