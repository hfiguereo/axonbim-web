import type { AxonDocument } from "@axonbim/model";

export interface Command {
  readonly id: string;
  readonly type: string;
  execute(doc: AxonDocument): void;
  undo(doc: AxonDocument): void;
}
