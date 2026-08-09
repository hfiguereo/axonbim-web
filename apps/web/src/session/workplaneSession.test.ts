import { describe, expect, it } from "vitest";
import { getActiveWorkplane, resolveSpatialReference } from "@axonbim/model";
import { useSessionStore } from "./createSessionStore";

describe("WP-v1 workplane in session", () => {
  it("creates walls on the active storey workplane", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().document.storeys[0]!.elevation = 2.4;
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 99 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 99 });
    const wall = useSessionStore.getState().document.walls[0]!;
    expect(wall.p1.z).toBe(2.4);
    expect(wall.p2.z).toBe(2.4);
    expect(wall.storeyId).toBe("storey.default");
  });

  it("exposes spatial reference from session storey", () => {
    useSessionStore.getState().newProject();
    const s = useSessionStore.getState();
    const ctx = resolveSpatialReference(s.document, s.activeStoreyId);
    expect(ctx.workplane.id).toBe("workplane.storey.storey.default");
    expect(getActiveWorkplane(s.document, s.activeStoreyId).kind).toBe("storey");
  });
});
