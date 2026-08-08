import type { Command, HistoryStack } from "@axonbim/commands";
import type { AxonDocument } from "@axonbim/model";
import { touchDoc } from "./touchDoc";

/** Status shown when a command ran but decided nothing changed (F5-S). */
export const NO_MUTATION_STATUS = "Sin cambios (operación no aplicada)";

/** The parts of session state a document mutation reads. */
export type DocumentSnapshot = {
  document: AxonDocument;
  history: HistoryStack;
  documentRev: number;
};

/** State patch to hand to the store after a successful mutation. */
export type DocumentPatch = DocumentSnapshot & { status: string };

export type CommandOutcome =
  | { mutated: true; patch: DocumentPatch }
  | { mutated: false; patch: { status: string } };

/**
 * Run a command through the history stack.
 *
 * Commands mutate the document in place (that is the SoT contract), so the
 * returned `document` is a fresh shallow clone purely so React sees a new
 * reference. A command that reports no mutation is not recorded and must not
 * bump `documentRev` nor clear the redo stack.
 */
export function applyCommandToSession(
  snapshot: DocumentSnapshot,
  cmd: Command,
  status: string,
): CommandOutcome {
  const mutated = snapshot.history.push(cmd, snapshot.document);
  if (!mutated) {
    return { mutated: false, patch: { status: NO_MUTATION_STATUS } };
  }
  return { mutated: true, patch: nextPatch(snapshot, status) };
}

/** `null` when there is nothing to undo (store leaves state untouched). */
export function undoInSession(
  snapshot: DocumentSnapshot,
  status: string,
): DocumentPatch | null {
  if (!snapshot.history.canUndo) return null;
  snapshot.history.undo(snapshot.document);
  return nextPatch(snapshot, status);
}

/** `null` when there is nothing to redo (store leaves state untouched). */
export function redoInSession(
  snapshot: DocumentSnapshot,
  status: string,
): DocumentPatch | null {
  if (!snapshot.history.canRedo) return null;
  snapshot.history.redo(snapshot.document);
  return nextPatch(snapshot, status);
}

function nextPatch(snapshot: DocumentSnapshot, status: string): DocumentPatch {
  return {
    document: touchDoc(snapshot.document),
    history: snapshot.history,
    documentRev: snapshot.documentRev + 1,
    status,
  };
}
