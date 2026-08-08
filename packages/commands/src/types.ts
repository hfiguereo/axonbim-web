import type { AxonDocument } from "@axonbim/model";

/**
 * Commands return whether they mutated the document.
 * HistoryStack only records mutating executions.
 */
export interface Command {
  readonly id: string;
  readonly type: string;
  execute(doc: AxonDocument): boolean;
  undo(doc: AxonDocument): void;
}
