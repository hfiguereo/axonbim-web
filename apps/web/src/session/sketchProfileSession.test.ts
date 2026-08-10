import { describe, expect, it } from "vitest";
import { profileFromClosedRing, profileVertices } from "@axonbim/tools";
import { useSessionStore } from "./createSessionStore";

describe("SK-replace — provisional free profile → new walls", () => {
  it("loads host plan footprint (4 edges), not the axis", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    const elev = useSessionStore.getState().document.storeys[0]!.elevation;
    const thickness = useSessionStore.getState().document.walls[0]!.thickness;

    useSessionStore.getState().enterSketchOnElement("wall", wallId);
    const s = useSessionStore.getState();
    expect(s.sketchProfile).not.toBeNull();
    expect(s.sketchProfile?.semantic).toBe("result");
    expect(s.sketchProfile?.edges).toHaveLength(4);
    expect(s.sketchProfile?.closed).toBe(true);
    expect(s.sketchProfile?.sourceWallIds).toEqual([wallId]);
    const ys = s.sketchProfile!.edges.flatMap((e) => [e.p1.y, e.p2.y]);
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(thickness, 5);
    expect(s.sketchProfile!.edges[0]!.p1.z).toBeCloseTo(elev);
    expect(s.document.walls).toHaveLength(1);
  });

  it("miss grip with line tool appends to provisional (does not wipe seed)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    useSessionStore.getState().enterSketchOnElement("wall", wallId);
    expect(useSessionStore.getState().sketchProfile?.edges).toHaveLength(4);

    useSessionStore.getState().setDrawMode("line");
    useSessionStore.getState().wallClick({ x: 10, y: 10, z: 0 });
    useSessionStore.getState().wallClick({ x: 12, y: 10, z: 0 });
    const prof = useSessionStore.getState().sketchProfile!;
    expect(prof.edges.length).toBeGreaterThanOrEqual(5);
    expect(useSessionStore.getState().document.walls).toHaveLength(1);
  });

  it("moves one vertex freely without constraining the rectangle", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    const half = wall.thickness / 2;
    useSessionStore.getState().enterSketchOnElement("wall", wall.id);

    useSessionStore.getState().profileVertexClick({ x: 2, y: half, z: 0 });
    useSessionStore.getState().profileVertexClick({ x: 5, y: half, z: 0 });

    expect(useSessionStore.getState().document.walls).toHaveLength(1);
    expect(useSessionStore.getState().document.walls[0]!.id).toBe(wall.id);

    const verts = profileVertices(useSessionStore.getState().sketchProfile!);
    const moved = verts.find(
      (v) => Math.abs(v.x - 5) < 1e-6 && Math.abs(v.y - half) < 1e-6,
    );
    expect(moved).toBeTruthy();
    // Opposite end-corner on +Y stays at x≈2 (not dragged with constrained rect).
    const stillAt2 = verts.some(
      (v) => Math.abs(v.x - 2) < 1e-6 && Math.abs(v.y + half) < 1e-6,
    );
    expect(stillAt2).toBe(true);
  });

  it("Terminar replaces host: new wall id from lengthened box footprint", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    const half = wall.thickness / 2;
    const oldId = wall.id;
    useSessionStore.getState().enterSketchOnElement("wall", oldId);

    // Session-only longer box (still wall-box shaped → 1 muro nuevo).
    useSessionStore.setState({
      sketchProfile: profileFromClosedRing(
        [
          { x: 0, y: -half, z: 0 },
          { x: 5, y: -half, z: 0 },
          { x: 5, y: half, z: 0 },
          { x: 0, y: half, z: 0 },
        ],
        [oldId],
        true,
      ),
    });

    useSessionStore.getState().finishSketchOnSelection();
    const after = useSessionStore.getState();
    expect(after.sketchTarget).toBeNull();
    expect(after.document.walls).toHaveLength(1);
    const next = after.document.walls[0]!;
    expect(next.id).not.toBe(oldId);
    const len = Math.hypot(next.p2.x - next.p1.x, next.p2.y - next.p1.y);
    expect(len).toBeCloseTo(5, 2);
    expect(next.thickness).toBeCloseTo(wall.thickness, 2);
  });

  it("free non-rect footprint Terminar creates walls from edges (replace)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    const half = wall.thickness / 2;
    const oldId = wall.id;
    useSessionStore.getState().enterSketchOnElement("wall", oldId);

    // Skew one corner only → non-invertible-as-single-box → axes-from-edges.
    useSessionStore.getState().profileVertexClick({ x: 2, y: half, z: 0 });
    useSessionStore.getState().profileVertexClick({ x: 5, y: half + 0.4, z: 0 });
    useSessionStore.getState().finishSketchOnSelection();

    const after = useSessionStore.getState();
    expect(after.sketchTarget).toBeNull();
    expect(after.document.walls.every((w) => w.id !== oldId)).toBe(true);
    // Free non-box silhouette → one new wall per usable edge.
    expect(after.document.walls).toHaveLength(4);
  });

  it("invalid short profile does not mutate on Terminar", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    useSessionStore.getState().enterSketchOnElement("wall", wallId);

    useSessionStore.getState().setDrawMode("rectangle");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 0.02, y: 0.02, z: 0 });

    const before = structuredClone(useSessionStore.getState().document.walls[0]!);
    useSessionStore.getState().finishSketchOnSelection();
    const s = useSessionStore.getState();
    expect(s.document.walls[0]!.p1.x).toBeCloseTo(before.p1.x);
    expect(s.document.walls[0]!.p2.x).toBeCloseTo(before.p2.x);
    expect(s.sketchProfile).not.toBeNull();
  });

  it("rectangle rebuild stays provisional until Terminar (replace)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().setDrawMode("rectangle");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 3, z: 0 });
    expect(useSessionStore.getState().document.walls).toHaveLength(4);
    const seedIds = useSessionStore.getState().document.walls.map((w) => w.id);
    const seedId = seedIds[0]!;

    useSessionStore.getState().enterSketchOnElement("wall", seedId);
    expect(useSessionStore.getState().sketchProfile?.semantic).toBe("result");

    useSessionStore.getState().setDrawMode("rectangle");
    useSessionStore.getState().wallClick({ x: 1, y: 1, z: 0 });
    useSessionStore.getState().wallClick({ x: 5, y: 4, z: 0 });
    expect(useSessionStore.getState().document.walls).toHaveLength(4);
    expect(useSessionStore.getState().sketchProfile?.semantic).toBe("axes");

    useSessionStore.getState().finishSketchOnSelection();
    expect(useSessionStore.getState().document.walls).toHaveLength(4);
    const xs = useSessionStore.getState().document.walls.flatMap((w) => [
      w.p1.x,
      w.p2.x,
    ]);
    expect(Math.min(...xs)).toBeCloseTo(1);
    expect(Math.max(...xs)).toBeCloseTo(5);
    // Replaced: at least the seed id is gone (loop may keep other originals
    // only if they were not in sourceWallIds — enter on one wall seeds loop).
    const afterIds = useSessionStore.getState().document.walls.map((w) => w.id);
    expect(afterIds.includes(seedId)).toBe(false);
  });

  it("Terminar without host mutation keeps the sketch profile", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wallId = useSessionStore.getState().document.walls[0]!.id;
    useSessionStore.getState().enterSketchOnElement("wall", wallId);
    useSessionStore.getState().finishSketchOnSelection();
    const s = useSessionStore.getState();
    expect(s.sketchTarget?.id).toBe(wallId);
    expect(s.sketchProfile).not.toBeNull();
    expect(s.status).toMatch(/Sin cambios/i);
    expect(s.document.walls[0]!.id).toBe(wallId);
  });

  it("surface workplane seeds face rectangle (length × height)", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    useSessionStore.getState().setWorkplaneFromSurface(wall.id, "front");
    useSessionStore.getState().enterSketchOnElement("wall", wall.id);
    const s = useSessionStore.getState();
    expect(s.activeWorkplane.kind).toBe("surface");
    expect(s.sketchProfile?.edges).toHaveLength(4);
    expect(s.sketchProfile?.semantic).toBe("result");
    const zs = s.sketchProfile!.edges.flatMap((e) => [e.p1.z, e.p2.z]);
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(wall.height, 5);
  });

  it("vertex place snaps to another footprint corner", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    const half = wall.thickness / 2;
    useSessionStore.getState().enterSketchOnElement("wall", wall.id);

    useSessionStore.getState().profileVertexClick({ x: 4, y: half, z: 0 });
    useSessionStore.getState().profileVertexClick({
      x: 0.05,
      y: half + 0.02,
      z: 0,
    });
    const verts = useSessionStore
      .getState()
      .sketchProfile!.edges.flatMap((e) => [e.p1, e.p2]);
    const atOriginSide = verts.some(
      (v) => Math.abs(v.x) < 1e-6 && Math.abs(v.y - half) < 1e-6,
    );
    const kind = useSessionStore.getState().lastSnapKind;
    expect(kind === "endpoint" || atOriginSide).toBe(true);
  });

  it("cancel discards provisional edits", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 2, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    const half = wall.thickness / 2;
    useSessionStore.getState().enterSketchOnElement("wall", wall.id);
    useSessionStore.getState().profileVertexClick({ x: 2, y: half, z: 0 });
    useSessionStore.getState().profileVertexClick({ x: 9, y: half, z: 0 });
    useSessionStore.getState().exitSketchOnSelection();
    expect(useSessionStore.getState().document.walls[0]!.p2.x).toBeCloseTo(2);
    expect(useSessionStore.getState().document.walls[0]!.id).toBe(wall.id);
    expect(useSessionStore.getState().sketchProfile).toBeNull();
  });
});
