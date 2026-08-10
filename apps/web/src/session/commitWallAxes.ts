import {
  CompositeCommand,
  CreateWallCommand,
  createWallId,
} from "@axonbim/commands";
import {
  findWallFamily,
  getActiveStorey,
  pointOnWorkplaneXY,
  wallVerticalFromHeight,
  workplaneFromStorey,
  type Wall,
} from "@axonbim/model";
import type { RectWallAxis } from "@axonbim/tools";
import { applyCommand } from "./sliceContracts.js";
import type { SessionState } from "./sliceTypes.js";

type Get = () => SessionState;
type Set = (partial: Partial<SessionState>) => void;

/** Project axes onto the level plane (walls always sit on storey). */
export function commitWallAxes(
  get: Get,
  set: Set,
  axes: RectWallAxis[],
  statusOk: string,
): boolean {
  if (axes.length === 0) {
    set({ status: "Trazo demasiado corto o inválido" });
    return false;
  }
  const s = get();
  const fam = findWallFamily(s.document.families, s.activeFamilyId);
  if (!fam) {
    set({ status: "Esa familia de muro no existe en el documento" });
    return false;
  }
  // Wall axes always use the level plane of the active workplane's storey.
  const storeyId = s.activeWorkplane?.storeyId ?? s.activeStoreyId;
  const storey = getActiveStorey(s.document, storeyId);
  const wp = workplaneFromStorey(storey);
  const steps = axes.map((axis) => {
    const wall: Wall = {
      id: createWallId(),
      storeyId: storey.id,
      familyId: fam.id,
      p1: pointOnWorkplaneXY(wp, axis.p1.x, axis.p1.y),
      p2: pointOnWorkplaneXY(wp, axis.p2.x, axis.p2.y),
      vertical: wallVerticalFromHeight(s.wallHeight),
      thickness: fam.thickness,
    };
    return new CreateWallCommand(wall);
  });
  const cmd =
    steps.length === 1
      ? steps[0]!
      : new CompositeCommand("wall.draw", steps);
  applyCommand(get, set, cmd, statusOk);
  return true;
}
