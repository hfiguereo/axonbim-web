import type { AxonDocument } from "@axonbim/model";
import type { Command } from "./types";

export class HistoryStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** @returns true if the command mutated and was recorded. */
  push(cmd: Command, doc: AxonDocument): boolean {
    const mutated = cmd.execute(doc);
    if (!mutated) return false;
    this.undoStack.push(cmd);
    this.redoStack = [];
    return true;
  }

  undo(doc: AxonDocument): void {
    const cmd = this.undoStack.pop();
    if (!cmd) return;
    cmd.undo(doc);
    this.redoStack.push(cmd);
  }

  redo(doc: AxonDocument): void {
    const cmd = this.redoStack.pop();
    if (!cmd) return;
    const mutated = cmd.execute(doc);
    if (!mutated) {
      // Should not happen for recorded commands; keep redo stack consistent
      this.redoStack.push(cmd);
      return;
    }
    this.undoStack.push(cmd);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
