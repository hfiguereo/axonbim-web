import { describe, expect, it } from "vitest";
import { HistoryStack, type Command } from "@axonbim/commands";
import { createEmptyDocument, type AxonDocument } from "@axonbim/model";
import {
  NO_MUTATION_STATUS,
  applyCommandToSession,
  redoInSession,
  undoInSession,
} from "./documentMutation";

/** Adds one wall; `mutates: false` models a command that declines to change. */
function fakeCommand(id: string, mutates = true): Command {
  return {
    id,
    type: "test.fake",
    execute(doc: AxonDocument) {
      if (!mutates) return false;
      doc.walls.push({
        id,
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 1, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      });
      return true;
    },
    undo(doc: AxonDocument) {
      doc.walls = doc.walls.filter((w) => w.id !== id);
    },
  };
}

function snapshot(document: AxonDocument, history: HistoryStack, rev = 0) {
  return { document, history, documentRev: rev };
}

describe("documentMutation (corte 7c)", () => {
  it("records a mutating command and bumps the revision", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    const out = applyCommandToSession(snapshot(doc, history, 4), fakeCommand("a"), "Hecho");

    expect(out.mutated).toBe(true);
    if (!out.mutated) return;
    expect(out.patch.documentRev).toBe(5);
    expect(out.patch.status).toBe("Hecho");
    expect(out.patch.document).not.toBe(doc);
    expect(out.patch.document.walls.map((w) => w.id)).toEqual(["a"]);
    expect(history.canUndo).toBe(true);
  });

  it("does not record a command that reports no mutation", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    const out = applyCommandToSession(
      snapshot(doc, history, 4),
      fakeCommand("noop", false),
      "Hecho",
    );

    expect(out.mutated).toBe(false);
    expect(out.patch.status).toBe(NO_MUTATION_STATUS);
    expect(history.canUndo).toBe(false);
  });

  it("keeps redo available when a command reports no mutation", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    applyCommandToSession(snapshot(doc, history), fakeCommand("a"), "Hecho");
    undoInSession(snapshot(doc, history, 1), "Deshacer");
    expect(history.canRedo).toBe(true);

    applyCommandToSession(snapshot(doc, history, 2), fakeCommand("noop", false), "Hecho");
    expect(history.canRedo).toBe(true);
  });

  it("undo reverts the document and bumps the revision", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    applyCommandToSession(snapshot(doc, history), fakeCommand("a"), "Hecho");

    const patch = undoInSession(snapshot(doc, history, 1), "Deshacer");
    expect(patch).not.toBeNull();
    expect(patch!.documentRev).toBe(2);
    expect(patch!.status).toBe("Deshacer");
    expect(patch!.document.walls).toEqual([]);
  });

  it("redo re-applies the undone command", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    applyCommandToSession(snapshot(doc, history), fakeCommand("a"), "Hecho");
    undoInSession(snapshot(doc, history, 1), "Deshacer");

    const patch = redoInSession(snapshot(doc, history, 2), "Rehacer");
    expect(patch).not.toBeNull();
    expect(patch!.documentRev).toBe(3);
    expect(patch!.document.walls.map((w) => w.id)).toEqual(["a"]);
  });

  it("undo and redo are no-ops on empty stacks", () => {
    const doc = createEmptyDocument();
    const history = new HistoryStack();
    expect(undoInSession(snapshot(doc, history), "Deshacer")).toBeNull();
    expect(redoInSession(snapshot(doc, history), "Rehacer")).toBeNull();
  });
});
