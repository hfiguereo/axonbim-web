import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Wall } from "@axonbim/model";
import {
  CreateDoorCommand,
  CreateWallCommand,
  HistoryStack,
  SetWallHeightCommand,
  SetWallVerticalProfileCommand,
  createDoorId,
  createWallId,
  resetDoorIdSeq,
  resetWallIdSeq,
} from "./index";

function uniformWall(partial?: Partial<Wall>): Wall {
  return {
    id: createWallId(),
    storeyId: "storey.default",
    familyId: "family.block-150",
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: 4, y: 0, z: 0 },
    thickness: 0.15,
    vertical: { kind: "uniform", height: 2.7 },
    ...partial,
  };
}

describe("SetWallVerticalProfileCommand (SK-wall-profile-v1 Bloque 4)", () => {
  it("applies a sloped profile in place and preserves wallId on undo/redo", () => {
    resetWallIdSeq(0);
    const doc = createEmptyDocument();
    const wall = uniformWall({ id: "wall.1" });
    const hist = new HistoryStack();
    expect(hist.push(new CreateWallCommand(wall), doc).ok).toBe(true);
    const idBefore = doc.walls[0]!.id;

    const slope = {
      kind: "profile" as const,
      outerLoop: [
        { u: 0, v: 0 },
        { u: 4, v: 0 },
        { u: 4, v: 2 },
        { u: 0, v: 3 },
      ],
    };
    const set = new SetWallVerticalProfileCommand("wall.1", slope);
    expect(hist.push(set, doc)).toEqual({ ok: true, changed: true });
    expect(doc.walls).toHaveLength(1);
    expect(doc.walls[0]!.id).toBe(idBefore);
    expect(doc.walls[0]!.vertical.kind).toBe("profile");
    if (doc.walls[0]!.vertical.kind === "profile") {
      expect(doc.walls[0]!.vertical.outerLoop).toHaveLength(4);
    }

    hist.undo(doc);
    expect(doc.walls[0]!.id).toBe(idBefore);
    expect(doc.walls[0]!.vertical).toEqual({ kind: "uniform", height: 2.7 });

    hist.redo(doc);
    expect(doc.walls[0]!.id).toBe(idBefore);
    expect(doc.walls[0]!.vertical.kind).toBe("profile");
  });

  it("returns noop when geometry is equivalent", () => {
    resetWallIdSeq(0);
    const doc = createEmptyDocument();
    const wall = uniformWall({ id: "wall.1" });
    new CreateWallCommand(wall).execute(doc);
    const r = new SetWallVerticalProfileCommand("wall.1", {
      kind: "uniform",
      height: 2.7,
    }).execute(doc);
    expect(r).toEqual({ ok: true, changed: false, code: "noop" });
  });

  it("rejects self-intersecting profile without mutating", () => {
    resetWallIdSeq(0);
    const doc = createEmptyDocument();
    new CreateWallCommand(uniformWall({ id: "wall.1" })).execute(doc);
    const before = structuredClone(doc.walls[0]!);
    const r = new SetWallVerticalProfileCommand("wall.1", {
      kind: "profile",
      outerLoop: [
        { u: 0, v: 0 },
        { u: 4, v: 0 },
        { u: 0, v: 3 },
        { u: 4, v: 3 },
      ],
    }).execute(doc);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("profile.selfIntersection");
    expect(doc.walls[0]).toEqual(before);
  });

  it("keeps door id/host when profile still contains the opening", () => {
    resetWallIdSeq(0);
    resetDoorIdSeq(0);
    const doc = createEmptyDocument();
    new CreateWallCommand(uniformWall({ id: "wall.1" })).execute(doc);
    const doorId = createDoorId();
    expect(
      new CreateDoorCommand({
        id: doorId,
        wallId: "wall.1",
        familyId: "family.door-90",
        centerOffset: 2,
        width: 0.9,
        height: 2.1,
        sill: 0,
        hinge: "start",
        swing: "positive",
        leafState: "open",
      }).execute(doc).ok,
    ).toBe(true);

    const hist = new HistoryStack();
    const r = hist.push(
      new SetWallVerticalProfileCommand("wall.1", {
        kind: "profile",
        outerLoop: [
          { u: 0, v: 0 },
          { u: 4, v: 0 },
          { u: 4, v: 2.7 },
          { u: 0, v: 2.7 },
        ],
      }),
      doc,
    );
    expect(r).toEqual({ ok: true, changed: true });
    expect(doc.doors[0]!.id).toBe(doorId);
    expect(doc.doors[0]!.wallId).toBe("wall.1");
    expect(doc.walls[0]!.id).toBe("wall.1");

    hist.undo(doc);
    expect(doc.doors[0]!.id).toBe(doorId);
    expect(doc.walls[0]!.id).toBe("wall.1");
  });

  it("rejects a profile that cuts a window without deleting it", () => {
    resetWallIdSeq(0);
    resetDoorIdSeq(0);
    const doc = createEmptyDocument();
    new CreateWallCommand(uniformWall({ id: "wall.1" })).execute(doc);
    doc.windows.push({
      id: "window.1",
      wallId: "wall.1",
      familyId: "family.window-90x120",
      centerOffset: 3.2,
      width: 1.0,
      height: 1.2,
      sill: 1.0,
      hinge: "start",
      swing: "positive",
      leafState: "closed",
    });
    const beforeWall = structuredClone(doc.walls[0]!);
    const beforeWin = structuredClone(doc.windows[0]!);
    const r = new SetWallVerticalProfileCommand("wall.1", {
      kind: "profile",
      outerLoop: [
        { u: 0, v: 0 },
        { u: 4, v: 0 },
        { u: 4, v: 1.5 },
        { u: 2, v: 1.5 },
        { u: 2, v: 2.7 },
        { u: 0, v: 2.7 },
      ],
    }).execute(doc);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toMatch(/opening\./);
    expect(doc.walls[0]).toEqual(beforeWall);
    expect(doc.windows[0]).toEqual(beforeWin);
  });

  it("SetWallHeightCommand refuses to overwrite a custom profile", () => {
    resetWallIdSeq(0);
    const doc = createEmptyDocument();
    new CreateWallCommand(uniformWall({ id: "wall.1" })).execute(doc);
    new SetWallVerticalProfileCommand("wall.1", {
      kind: "profile",
      outerLoop: [
        { u: 0, v: 0 },
        { u: 4, v: 0 },
        { u: 4, v: 2 },
        { u: 0, v: 3 },
      ],
    }).execute(doc);
    const r = new SetWallHeightCommand("wall.1", 2.5).execute(doc);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("wall.profile.heightLocked");
    expect(doc.walls[0]!.vertical.kind).toBe("profile");
  });
});
