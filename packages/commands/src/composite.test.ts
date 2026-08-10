import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Wall } from "@axonbim/model";
import { CompositeCommand } from "./composite";
import { CreateWallCommand, HistoryStack, createWallId, syncIdSequencesFromDocument } from "./index";
import { CHANGED, NOOP, rejected, type Command, type CommandResult } from "./types";

function wall(partial: Partial<Wall> & Pick<Wall, "id" | "p1" | "p2">): Wall {
  return {
    storeyId: "storey.default",
    familyId: "family.block-150",
    thickness: 0.15,
    vertical: { kind: "uniform", height: 2.7 },
    ...partial,
  };
}

class FailAfterCommand implements Command {
  readonly id = "cmd.fail";
  readonly type = "test.fail";
  execute(): CommandResult {
    return rejected({ code: "test.fail", message: "forced failure" });
  }
  undo(): void {}
}

class TrackingNoop implements Command {
  readonly id = "cmd.noop";
  readonly type = "test.noop";
  execute(): CommandResult {
    return NOOP;
  }
  undo(): void {}
}

describe("CompositeCommand (LR2)", () => {
  it("two internal creates → one history entry; undo/redo both", () => {
    const doc = createEmptyDocument();
    syncIdSequencesFromDocument(doc);
    const history = new HistoryStack();
    const a = wall({
      id: createWallId(),
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 2, y: 0, z: 0 },
    });
    const b = wall({
      id: createWallId(),
      p1: { x: 2, y: 0, z: 0 },
      p2: { x: 2, y: 3, z: 0 },
    });
    const composite = new CompositeCommand("test.twoWalls", [
      new CreateWallCommand(a),
      new CreateWallCommand(b),
    ]);
    expect(history.push(composite, doc)).toEqual(CHANGED);
    expect(doc.walls).toHaveLength(2);
    expect(history.canUndo).toBe(true);

    history.undo(doc);
    expect(doc.walls).toHaveLength(0);
    expect(history.canRedo).toBe(true);

    history.redo(doc);
    expect(doc.walls).toHaveLength(2);
    expect(doc.walls.map((w) => w.id)).toEqual([a.id, b.id]);
  });

  it("failure before commit leaves document intact and preserves redo", () => {
    const doc = createEmptyDocument();
    syncIdSequencesFromDocument(doc);
    const history = new HistoryStack();
    const first = wall({
      id: createWallId(),
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 1, y: 0, z: 0 },
    });
    history.push(new CreateWallCommand(first), doc);
    history.undo(doc);
    expect(history.canRedo).toBe(true);

    const ok = wall({
      id: createWallId(),
      p1: { x: 0, y: 1, z: 0 },
      p2: { x: 1, y: 1, z: 0 },
    });
    const result = history.push(
      new CompositeCommand("test.failMid", [new CreateWallCommand(ok), new FailAfterCommand()]),
      doc,
    );
    expect(result.ok).toBe(false);
    expect(doc.walls).toHaveLength(0);
    expect(history.canRedo).toBe(true);
    expect(history.canUndo).toBe(false);
  });

  it("all no-ops → noop, not recorded", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    const result = history.push(
      new CompositeCommand("test.noop", [new TrackingNoop(), new TrackingNoop()]),
      doc,
    );
    expect(result).toEqual(NOOP);
    expect(history.canUndo).toBe(false);
  });
});
