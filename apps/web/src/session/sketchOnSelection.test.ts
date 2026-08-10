import { describe, expect, it } from "vitest";
import { useSessionStore } from "./createSessionStore";

/** Bloque 5 entry: perspective + face (not plan / storey WP). */
function enterWallFaceSketch(wallId: string, face: "front" | "back" = "front") {
  useSessionStore.getState().setActiveView("view.3d.perspective");
  useSessionStore.getState().enterSketchOnElement("wall", wallId, { face });
}

describe("SK-sel sketch on selection", () => {
  it("enters sketch on selected wall and reuses draw tools", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;

    useSessionStore.getState().setSelectedWallId(wallId);
    useSessionStore.getState().setActiveView("view.3d.perspective");
    useSessionStore.getState().setWorkplaneFromSurface(wallId, "front");
    useSessionStore.getState().enterSketchOnSelection();

    const s = useSessionStore.getState();
    expect(s.sketchTarget).toEqual({ kind: "wall", id: wallId });
    expect(s.editingParadigm).toBe("sketch");
    expect(s.activeTool).toBe("wall");
    expect(s.drawMode).toBe("line");
    expect(s.sketchProfile?.edges.length).toBeGreaterThanOrEqual(1);
    expect(s.ribbonTab).toBe("modify");
    expect(s.selectedWallId).toBe(wallId);
    expect(s.activeWorkplane.kind).toBe("surface");
  });

  it("enters via enterSketchOnElement (double-click path)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().openDemo();
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    enterWallFaceSketch(wallId);
    expect(useSessionStore.getState().sketchTarget?.id).toBe(wallId);
    expect(useSessionStore.getState().activeStoreyId).toBe(
      useSessionStore.getState().document.walls[0]!.storeyId,
    );
    expect(useSessionStore.getState().activeWorkplane.host?.face).toBe("front");
  });

  it("exits back to parametric and keeps selection", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().openDemo();
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    enterWallFaceSketch(wallId);
    useSessionStore.getState().exitSketchOnSelection();
    const s = useSessionStore.getState();
    expect(s.sketchTarget).toBeNull();
    expect(s.editingParadigm).toBe("parametric");
    expect(s.activeTool).toBe("select");
    expect(s.selectedWallId).toBe(wallId);
  });

  it("rejects sketch on selection without element", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().enterSketchOnSelection();
    expect(useSessionStore.getState().sketchTarget).toBeNull();
    expect(useSessionStore.getState().status).toMatch(/Selecciona/i);
  });
});
