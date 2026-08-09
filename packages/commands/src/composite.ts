import type { AxonDocument } from "@axonbim/model";
import { CHANGED, NOOP, didChange, type Command, type CommandResult } from "./types";

/**
 * LR2 — one logical user action → one history entry.
 * Steps run in order; on rejection, already-applied steps are undone (atomic).
 */
export class CompositeCommand implements Command {
  readonly id: string;
  readonly type: string;
  private readonly steps: Command[];
  /** Steps that reported `changed` during the last successful execute. */
  private applied: Command[] = [];

  constructor(type: string, steps: Command[], id?: string) {
    this.type = type;
    this.steps = steps;
    this.id = id ?? `cmd.composite.${type}`;
  }

  execute(doc: AxonDocument): CommandResult {
    this.applied = [];
    for (const step of this.steps) {
      const result = step.execute(doc);
      if (!result.ok) {
        for (let i = this.applied.length - 1; i >= 0; i--) {
          this.applied[i]!.undo(doc);
        }
        this.applied = [];
        return result;
      }
      if (didChange(result)) {
        this.applied.push(step);
      }
    }
    if (this.applied.length === 0) return NOOP;
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    for (let i = this.applied.length - 1; i >= 0; i--) {
      this.applied[i]!.undo(doc);
    }
  }
}
