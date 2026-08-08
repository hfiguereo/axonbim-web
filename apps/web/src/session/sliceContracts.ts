/**
 * Cross-slice contracts for the composed session store.
 *
 * Slices call each other through get() after merge — never import peer slices
 * directly, to avoid circular dependencies.
 *
 * | Caller | Callee | Contract |
 * |--------|--------|----------|
 * | sketchToolSlice.setTool | selection (via set) | Clears selected* when switching tools |
 * | selectionSlice.setSelected* | viewportBridge.syncOrbitPivot | Re-applies orbit pivot on selection |
 * | sketchToolSlice.cameraClick | viewCropSlice (via set) | Opens camera ProjectView + activeViewId |
 * | viewCropSlice.* | projectSlice.applyCommand | Mutations go through HistoryStack |
 * | elementEditHandlers | projectSlice.applyCommand | Property edits are commands |
 */
import type { Command } from "@axonbim/commands";
import { applyCommandToSession } from "./documentMutation.js";
import type { SessionState } from "./sliceTypes.js";

export function applyCommand(
  get: () => SessionState,
  set: (partial: Partial<SessionState>) => void,
  cmd: Command,
  status: string,
): void {
  const { document, history, documentRev } = get();
  const outcome = applyCommandToSession({ document, history, documentRev }, cmd, status);
  set(outcome.patch);
}

/** Clears element selection without touching crop-frame selection semantics. */
export function clearElementSelection(): Partial<SessionState> {
  return {
    selectedWallId: null,
    selectedDoorId: null,
    selectedWindowId: null,
    selectedCameraId: null,
    selectedCropFrameCameraId: null,
  };
}
