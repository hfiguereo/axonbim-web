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

  push(cmd: Command, doc: AxonDocument): void {
    cmd.execute(doc);
    this.undoStack.push(cmd);
    this.redoStack = [];
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
    cmd.execute(doc);
    this.undoStack.push(cmd);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
