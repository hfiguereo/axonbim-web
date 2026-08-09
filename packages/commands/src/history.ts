import type { AxonDocument } from "@axonbim/model";
import { didChange, type Command, type CommandResult } from "./types";

export class HistoryStack {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Records the command only if it mutated. A no-op and a rejection both leave
   * the stacks untouched — in particular neither one clears redo (F5-S).
   */
  push(cmd: Command, doc: AxonDocument): CommandResult {
    const result = cmd.execute(doc);
    if (!didChange(result)) return result;
    this.undoStack.push(cmd);
    this.redoStack = [];
    return result;
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
    if (!didChange(cmd.execute(doc))) {
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
