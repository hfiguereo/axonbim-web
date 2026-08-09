import type { AxonDocument, Door, Window } from "@axonbim/model";
import {
  asOpeningSpec,
  openingsOnWall,
  validateHostedOpening,
} from "@axonbim/model";
import { rejected, type CommandResult } from "./types";

/**
 * After entity-level validation: host exists, opening fits the wall, and does
 * not overlap any other door/window on that wall (F9-E2).
 */
export function checkHostedOpening(
  doc: AxonDocument,
  candidate: Door | Window,
): CommandResult | null {
  const wall = doc.walls.find((w) => w.id === candidate.wallId);
  if (!wall) {
    return rejected({
      code: "opening.wall.unknown",
      message: `opening ${candidate.id}: host wall ${candidate.wallId} not found`,
    });
  }
  const others = openingsOnWall(candidate.wallId, doc.doors, doc.windows, candidate.id);
  const issue = validateHostedOpening(asOpeningSpec(candidate), wall, others);
  return issue ? rejected(issue) : null;
}
