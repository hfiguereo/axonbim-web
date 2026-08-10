import { describe, expect, it } from "vitest";
import { ARC_SEGMENTS } from "@axonbim/tools";
import { useSessionStore } from "./createSessionStore";

describe("SK-draw draw tools", () => {
  it("commits arcSER as tessellated walls in one undo", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("arcSER");
    useSessionStore.getState().wallClick({ x: 1, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 0, y: 1, z: 0 });
    useSessionStore.getState().wallClick({
      x: Math.SQRT1_2,
      y: Math.SQRT1_2,
      z: 0,
    });
    const n = useSessionStore.getState().document.walls.length;
    expect(n).toBe(ARC_SEGMENTS);
    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.walls).toHaveLength(0);
  });

  it("commits arcCE as tessellated walls", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("arcCE");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 0, y: 2, z: 0 });
    expect(useSessionStore.getState().document.walls.length).toBe(ARC_SEGMENTS);
  });

  it("pickLines starts P1 at closer wall endpoint", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 5, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;

    useSessionStore.getState().setDrawMode("pickLines");
    useSessionStore.getState().wallPickClick(wallId, { x: 4.8, y: 0.1, z: 0 });
    expect(useSessionStore.getState().wallPending).toEqual({
      x: 5,
      y: 0,
      z: 0,
    });
    useSessionStore.getState().wallClick({ x: 5, y: 3, z: 0 });
    expect(useSessionStore.getState().document.walls.length).toBe(2);
  });

  it("pickFace sets active storey from wall", () => {
    useSessionStore.getState().newProject();
    const doc = useSessionStore.getState().document;
    doc.storeys.push({ id: "storey.2", name: "N2", elevation: 3 });
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().setActiveStoreyId("storey.2");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    expect(wall.storeyId).toBe("storey.2");

    useSessionStore.getState().setActiveStoreyId("storey.default");
    useSessionStore.getState().setDrawMode("pickFace");
    useSessionStore.getState().wallPickClick(wall.id);
    expect(useSessionStore.getState().activeStoreyId).toBe("storey.2");
  });
});
