import { HistoryStack } from "@axonbim/commands";
import {
  createDemoDocument,
  createEmptyDocument,
  getActiveWorkplane,
  reconcileActiveStoreyId,
} from "@axonbim/model";
import { parseDocument, parseDocumentRecover, serializeDocument } from "@axonbim/persistence";
import { patchViewsAfterDocumentChange } from "./cameraViews.js";
import { redoInSession, undoInSession } from "./documentMutation.js";
import { presentationFromViews } from "./presentationViews.js";
import { resetSessionForDocument } from "./sessionReset.js";
import type { SessionSliceCreator } from "./sliceTypes.js";

function recoveryStatus(fileName: string | undefined, warnings: string[]): string {
  const base = fileName ? `Recuperado: ${fileName}` : "Copia recuperada";
  if (warnings.length === 0) return `${base} (sin avisos)`;
  const head = warnings.slice(0, 2).join(" · ");
  const more = warnings.length > 2 ? ` (+${warnings.length - 2} más)` : "";
  return `${base} — ${warnings.length} aviso(s): ${head}${more}`;
}

export const createProjectSlice: SessionSliceCreator<{
  document: ReturnType<typeof createEmptyDocument>;
  history: HistoryStack;
  documentRev: number;
  /** LR3-A — session context; reconciled against document.storeys. */
  activeStoreyId: string;
  setActiveStoreyId: (id: string) => void;
  newProject: () => void;
  openDemo: () => void;
  openFromText: (text: string, fileName?: string) => void;
  recoverFromText: (text: string, fileName?: string) => void;
  exportText: () => string;
  runUndo: () => void;
  runRedo: () => void;
}> = (set, get) => ({
  document: createEmptyDocument(),
  history: new HistoryStack(),
  documentRev: 0,
  activeStoreyId: "storey.default",

  setActiveStoreyId: (id) => {
    const s = get();
    const next = reconcileActiveStoreyId(s.document, id);
    if (next !== id) {
      set({
        activeStoreyId: next,
        status: "Nivel inexistente — se mantuvo el nivel válido",
      });
      return;
    }
    const wp = getActiveWorkplane(s.document, next);
    set({
      activeStoreyId: next,
      status: `Plano de trabajo: ${wp.label} (z=${wp.origin.z.toFixed(2)} m)`,
    });
  },

  newProject: () => {
    set({
      ...resetSessionForDocument(createEmptyDocument(), get()),
      documentRev: get().documentRev + 1,
      status: "Nuevo proyecto",
    });
  },

  openDemo: () => {
    set({
      ...resetSessionForDocument(createDemoDocument(), get()),
      documentRev: get().documentRev + 1,
      fitViewRequest: get().fitViewRequest + 1,
      status: "Demo — vivienda 8×6 m (Abrir demo)",
    });
  },

  openFromText: (text, fileName) => {
    try {
      const document = parseDocument(text);
      set({
        ...resetSessionForDocument(document, get()),
        documentRev: get().documentRev + 1,
        fitViewRequest: get().fitViewRequest + 1,
        status: fileName ? `Abierto: ${fileName}` : "Proyecto importado",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al abrir";
      get().setStatus(message);
    }
  },

  recoverFromText: (text, fileName) => {
    try {
      const { document, warnings } = parseDocumentRecover(text);
      set({
        ...resetSessionForDocument(document, get()),
        documentRev: get().documentRev + 1,
        fitViewRequest: get().fitViewRequest + 1,
        status: recoveryStatus(fileName, warnings),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al recuperar";
      get().setStatus(message);
    }
  },

  exportText: () => {
    const { document, views } = get();
    return serializeDocument({
      ...document,
      presentation: presentationFromViews(views),
    });
  },

  runUndo: () => {
    const { document, history, documentRev } = get();
    const patch = undoInSession({ document, history, documentRev }, "Deshacer");
    if (!patch) return;
    const { views, activeViewId } = patchViewsAfterDocumentChange(
      get().views,
      get().activeViewId,
      patch.document.cameras,
    );
    set({
      ...patch,
      views,
      activeViewId,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
      cropDragMeta: null,
      cropDragLive: null,
      cameraPoseDragLive: null,
    });
  },

  runRedo: () => {
    const { document, history, documentRev } = get();
    const patch = redoInSession({ document, history, documentRev }, "Rehacer");
    if (!patch) return;
    const { views, activeViewId } = patchViewsAfterDocumentChange(
      get().views,
      get().activeViewId,
      patch.document.cameras,
    );
    set({
      ...patch,
      views,
      activeViewId,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
      cropDragMeta: null,
      cropDragLive: null,
      cameraPoseDragLive: null,
    });
  },
});
