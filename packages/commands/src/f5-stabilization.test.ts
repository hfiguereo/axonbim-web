import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Door, type Wall, type Window } from "@axonbim/model";
import {
  CreateWallCommand,
  DeleteWallCommand,
  HistoryStack,
  createDoorId,
  createWallId,
  createWindowId,
  syncIdSequencesFromDocument,
} from "./index";

function wall(partial: Partial<Wall> & Pick<Wall, "id">): Wall {
  return {
    storeyId: "storey.default",
    familyId: "family.block-150",
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: 2, y: 0, z: 0 },
    thickness: 0.15,
    vertical: { kind: "uniform", height: 2.7 },
    ...partial,
  };
}

function door(partial: Partial<Door> & Pick<Door, "id" | "wallId">): Door {
  return {
    familyId: "family.door-90",
    centerOffset: 1,
    width: 0.9,
    height: 2.1,
    sill: 0,
    hinge: "start",
    swing: "positive",
    leafState: "open",
    ...partial,
  };
}

function window(partial: Partial<Window> & Pick<Window, "id" | "wallId">): Window {
  return {
    familyId: "family.window-90x120",
    centerOffset: 1,
    width: 0.9,
    height: 1.2,
    sill: 0.9,
    hinge: "start",
    swing: "positive",
    leafState: "closed",
    ...partial,
  };
}

describe("F5-S IDs", () => {
  it("REG-01 empty → create wall.1", () => {
    const doc = createEmptyDocument();
    syncIdSequencesFromDocument(doc);
    const id = createWallId();
    expect(id).toBe("wall.1");
    expect(new CreateWallCommand(wall({ id })).execute(doc)).toEqual({
      ok: true,
      changed: true,
    });
    expect(doc.walls.map((w) => w.id)).toEqual(["wall.1"]);
  });

  it("REG-01 import with wall.1 and wall.7 → next is wall.8", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" }), wall({ id: "wall.7", p1: { x: 3, y: 0, z: 0 }, p2: { x: 5, y: 0, z: 0 } })];
    syncIdSequencesFromDocument(doc);
    expect(createWallId()).toBe("wall.8");
  });

  it("REG-02 import doors → next door id unique", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" })];
    doc.doors = [door({ id: "door.1", wallId: "wall.1" }), door({ id: "door.4", wallId: "wall.1", centerOffset: 1.5 })];
    syncIdSequencesFromDocument(doc);
    expect(createDoorId()).toBe("door.5");
  });

  it("REG-02b import windows → next window id unique", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" })];
    doc.windows = [window({ id: "window.2", wallId: "wall.1" })];
    syncIdSequencesFromDocument(doc);
    expect(createWindowId()).toBe("window.3");
  });
});

describe("F5-S DeleteWall undo", () => {
  it("REG-03 muro + puerta + ventana → delete → undo restores all", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" })];
    doc.doors = [door({ id: "door.1", wallId: "wall.1" })];
    doc.windows = [window({ id: "window.1", wallId: "wall.1" })];
    const hist = new HistoryStack();
    expect(hist.push(new DeleteWallCommand("wall.1"), doc)).toEqual({
      ok: true,
      changed: true,
    });
    expect(doc.walls).toHaveLength(0);
    expect(doc.doors).toHaveLength(0);
    expect(doc.windows).toHaveLength(0);
    hist.undo(doc);
    expect(doc.walls.map((w) => w.id)).toEqual(["wall.1"]);
    expect(doc.doors.map((d) => d.id)).toEqual(["door.1"]);
    expect(doc.windows.map((w) => w.id)).toEqual(["window.1"]);
  });

  it("REG-09 delete → undo → redo", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" })];
    doc.doors = [door({ id: "door.1", wallId: "wall.1" })];
    doc.windows = [window({ id: "window.1", wallId: "wall.1" })];
    const hist = new HistoryStack();
    hist.push(new DeleteWallCommand("wall.1"), doc);
    hist.undo(doc);
    hist.redo(doc);
    expect(doc.walls).toHaveLength(0);
    expect(doc.doors).toHaveLength(0);
    expect(doc.windows).toHaveLength(0);
  });
});

describe("F5-S history no-op", () => {
  it("REG-05 duplicate create does not enter history", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ id: "wall.1" })];
    const hist = new HistoryStack();
    const result = hist.push(new CreateWallCommand(wall({ id: "wall.1" })), doc);
    expect(result.ok).toBe(false);
    expect(hist.canUndo).toBe(false);
  });
});
