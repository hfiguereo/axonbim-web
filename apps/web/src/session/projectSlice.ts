import { HistoryStack, syncIdSequencesFromDocument } from "@axonbim/commands";
import { createDemoDocument, createEmptyDocument } from "@axonbim/model";
import { parseDocument, serializeDocument } from "@axonbim/persistence";
import { redoInSession, undoInSession } from "./documentMutation.js";
import { defaultViews } from "./defaultViews.js";
import type { SessionSliceCreator } from "./sliceTypes.js";

export const createProjectSlice: SessionSliceCreator<{
  document: ReturnType<typeof createEmptyDocument>;
  history: HistoryStack;
  documentRev: number;
  newProject: () => void;
  openDemo: () => void;
  openFromText: (text: string, fileName?: string) => void;
  exportText: () => string;
  runUndo: () => void;
  runRedo: () => void;
}> = (set, get) => ({
  document: createEmptyDocument(),
  history: new HistoryStack(),
  documentRev: 0,

  newProject: () => {
    const document = createEmptyDocument();
    syncIdSequencesFromDocument(document);
    set({
      document,
      history: new HistoryStack(),
      views: defaultViews(),
      activeViewId: "view.plan.level1",
      activeTool: "none",
      ribbonTab: "architecture",
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
      documentRev: get().documentRev + 1,
      status: "Nuevo proyecto",
    });
  },

  openDemo: () => {
    const document = createDemoDocument();
    syncIdSequencesFromDocument(document);
    set({
      document,
      history: new HistoryStack(),
      views: defaultViews(),
      activeViewId: "view.plan.level1",
      activeTool: "none",
      ribbonTab: "architecture",
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
      documentRev: get().documentRev + 1,
      fitViewRequest: get().fitViewRequest + 1,
      status: "Demo — vivienda 8×6 m (Abrir demo)",
    });
  },

  openFromText: (text, fileName) => {
    try {
      const document = parseDocument(text);
      syncIdSequencesFromDocument(document);
      set({
        document,
        history: new HistoryStack(),
        activeTool: "none",
        selectedWallId: null,
        selectedDoorId: null,
        selectedWindowId: null,
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        documentRev: get().documentRev + 1,
        fitViewRequest: get().fitViewRequest + 1,
        status: fileName ? `Abierto: ${fileName}` : "Proyecto importado",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al abrir";
      get().setStatus(message);
    }
  },

  exportText: () => serializeDocument(get().document),

  runUndo: () => {
    const { document, history, documentRev } = get();
    const patch = undoInSession({ document, history, documentRev }, "Deshacer");
    if (!patch) return;
    set({
      ...patch,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
    });
  },

  runRedo: () => {
    const { document, history, documentRev } = get();
    const patch = redoInSession({ document, history, documentRev }, "Rehacer");
    if (!patch) return;
    set({
      ...patch,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
    });
  },
});
