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
 * | sketchToolSlice.cameraClick | applyCommand | Camera tabs derived from document.cameras (F9-E4) |
 * | viewCropSlice.* | projectSlice.applyCommand | Mutations go through HistoryStack |
 * | elementEditHandlers | projectSlice.applyCommand | Property edits are commands |
 */
import type { Command } from "@axonbim/commands";
import { patchViewsAfterDocumentChange } from "./cameraViews.js";
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
  if (!outcome.mutated) {
    set(outcome.patch);
    return;
  }
  const { views, activeViewId } = patchViewsAfterDocumentChange(
    get().views,
    get().activeViewId,
    outcome.patch.document.cameras,
  );
  set({ ...outcome.patch, views, activeViewId });
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
