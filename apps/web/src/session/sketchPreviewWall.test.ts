import { describe, expect, it } from "vitest";
import { wallMaxHeightOf } from "@axonbim/model";
import { profileFromClosedRing } from "@axonbim/tools";
import { useSessionStore } from "./createSessionStore";
import { previewWallFromSketchProfile } from "./sketchPreviewWall";

describe("H3 previewWallFromSketchProfile", () => {
  it("builds a display wall with sloped profile without mutating the document", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 4, y: 0, z: 0 });
    const host = useSessionStore.getState().document.walls[0]!;
    const half = host.thickness / 2;
    const beforeVertical = structuredClone(host.vertical);

    const preview = previewWallFromSketchProfile(
      host,
      profileFromClosedRing(
        [
          { x: 0, y: half, z: 0 },
          { x: 4, y: half, z: 0 },
          { x: 4, y: half, z: 2.0 },
          { x: 0, y: half, z: 3.0 },
        ],
        [host.id],
        true,
      ),
    );
    expect(preview).not.toBeNull();
    expect(preview!.id).toBe(host.id);
    expect(preview!.vertical.kind).toBe("profile");
    expect(wallMaxHeightOf(preview!)).toBeCloseTo(3.0);

    const docWall = useSessionStore.getState().document.walls[0]!;
    expect(docWall.vertical).toEqual(beforeVertical);
  });

  it("returns null for an open / empty provisional", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const host = useSessionStore.getState().document.walls[0]!;
    expect(
      previewWallFromSketchProfile(host, {
        sourceWallIds: [host.id],
        edges: [],
        closed: false,
        semantic: "result",
      }),
    ).toBeNull();
  });
});
