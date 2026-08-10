import { describe, expect, it } from "vitest";
import { projectPointOntoWorkplane } from "@axonbim/model";
import { useSessionStore } from "./createSessionStore";

function expectOnPlane(
  wp: ReturnType<typeof useSessionStore.getState>["activeWorkplane"],
  p: { x: number; y: number; z: number },
) {
  const q = projectPointOntoWorkplane(wp, p);
  expect(p.x).toBeCloseTo(q.x, 5);
  expect(p.y).toBeCloseTo(q.y, 5);
  expect(p.z).toBeCloseTo(q.z, 5);
}

describe("WP-v2 tangible workplanes", () => {
  it("defaults to the level workplane on new project", () => {
    useSessionStore.getState().newProject();
    const s = useSessionStore.getState();
    expect(s.activeWorkplane.kind).toBe("storey");
    expect(s.workplaneLock).toBe("auto-level");
    expect(s.activeWorkplane.storeyId).toBe(s.activeStoreyId);
  });

  it("selects a wall face as surface workplane", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;

    useSessionStore.getState().workplaneSelectClick(wallId, { x: 1.5, y: 1, z: 0 });
    const s = useSessionStore.getState();
    expect(s.activeWorkplane.kind).toBe("surface");
    expect(s.activeWorkplane.host?.id).toBe(wallId);
    expect(s.workplaneLock).toBe("manual");
    expect(s.activeWorkplane.normal.z).toBeCloseTo(0);
  });

  it("creates a vertical plane from a line trace", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("workplaneLine");
    useSessionStore.getState().workplaneLineClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().workplaneLineClick({ x: 2, y: 0, z: 0 });
    const s = useSessionStore.getState();
    expect(s.activeWorkplane.kind).toBe("line");
    expect(s.activeWorkplane.axisV.z).toBe(1);
    expect(s.workplaneLock).toBe("manual");
  });

  it("reset and storey change restore the level plane", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("workplaneLine");
    useSessionStore.getState().workplaneLineClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().workplaneLineClick({ x: 2, y: 0, z: 0 });
    expect(useSessionStore.getState().activeWorkplane.kind).toBe("line");

    useSessionStore.getState().resetWorkplaneToLevel();
    expect(useSessionStore.getState().activeWorkplane.kind).toBe("storey");
    expect(useSessionStore.getState().workplaneLock).toBe("auto-level");

    useSessionStore.getState().setWorkplaneFromLine(
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    );
    useSessionStore.getState().setActiveStoreyId(
      useSessionStore.getState().activeStoreyId,
    );
    expect(useSessionStore.getState().activeWorkplane.kind).toBe("storey");
  });

  it("empty select click returns to level", () => {
    useSessionStore.getState().openDemo();
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    useSessionStore.getState().setWorkplaneFromSurface(wallId, "front");
    expect(useSessionStore.getState().activeWorkplane.kind).toBe("surface");
    useSessionStore.getState().workplaneSelectClick(null);
    expect(useSessionStore.getState().activeWorkplane.kind).toBe("storey");
  });

  it("sketch profile and vertex moves stay on the selected surface plane", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;

    useSessionStore.getState().setActiveView("view.3d.perspective");
    useSessionStore.getState().setWorkplaneFromSurface(wallId, "front");
    const wpBefore = useSessionStore.getState().activeWorkplane;
    expect(wpBefore.kind).toBe("surface");

    useSessionStore.getState().enterSketchOnElement("wall", wallId);
    const s = useSessionStore.getState();
    expect(s.activeWorkplane.kind).toBe("surface");
    expect(s.sketchProfile).not.toBeNull();
    for (const e of s.sketchProfile!.edges) {
      expectOnPlane(s.activeWorkplane, e.p1);
      expectOnPlane(s.activeWorkplane, e.p2);
    }

    const v0 = s.sketchProfile!.edges[0]!.p1;
    useSessionStore.getState().profileVertexClick(v0);
    const target = projectPointOntoWorkplane(s.activeWorkplane, {
      x: v0.x,
      y: v0.y,
      z: v0.z + 1.2,
    });
    useSessionStore.getState().profileVertexClick(target);
    const after = useSessionStore.getState();
    expect(after.profileVertexIndex).toBeNull();
    const moved = after.sketchProfile!.edges[0]!.p1;
    expectOnPlane(after.activeWorkplane, moved);
    expect(moved.z).toBeCloseTo(target.z, 5);
  });

  it("WP-04: sketch freezes Workplane (storey / surface change blocked)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    useSessionStore.getState().setActiveView("view.3d.perspective");
    useSessionStore.getState().enterSketchOnElement("wall", wallId, { face: "front" });
    const wpId = useSessionStore.getState().activeWorkplane.id;

    useSessionStore.getState().resetWorkplaneToLevel();
    expect(useSessionStore.getState().activeWorkplane.id).toBe(wpId);
    expect(useSessionStore.getState().status).toMatch(/Sketch activo/i);

    useSessionStore.getState().setActiveStoreyId(
      useSessionStore.getState().activeStoreyId,
    );
    expect(useSessionStore.getState().activeWorkplane.id).toBe(wpId);

    useSessionStore.getState().setWorkplaneFromSurface(wallId, "back");
    expect(useSessionStore.getState().activeWorkplane.host?.face).toBe("front");
  });
});
