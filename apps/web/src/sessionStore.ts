import {
  CreateWallCommand,
  DeleteWallCommand,
  HistoryStack,
  SetWallFamilyCommand,
  SetWallHeightCommand,
  SetWallThicknessCommand,
  createWallId,
  type Command,
} from "@axonbim/commands";
import { familyById } from "@axonbim/families";
import {
  createDemoDocument,
  createEmptyDocument,
  type AxonDocument,
  type Wall,
} from "@axonbim/model";
import { parseDocument, serializeDocument } from "@axonbim/persistence";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { DrawMode, ToolId } from "@axonbim/tools";
import { isSketchTool } from "@axonbim/tools";
import { create } from "zustand";

export type RibbonTab =
  | "architecture"
  | "structure"
  | "insert"
  | "annotate"
  | "analyze"
  | "massing"
  | "collaborate"
  | "view"
  | "manage"
  | "modify"
  | "contextual"
  | "project"; // legacy alias unused in tabs
export type ViewKind = "plan" | "perspective";
export type VisualStyle = "wireframe" | "hiddenLine" | "shaded";
export type DetailLevel = "coarse" | "medium" | "fine";
/** Revit-like: docked to app edge or floating over drawing area. */
export type DockSide = "left" | "right" | "float";
export type PanelId = "browser" | "properties";
export type FloatPos = { x: number; y: number };

export type ProjectView = {
  id: string;
  name: string;
  kind: ViewKind;
  open: boolean;
};

type SessionState = {
  document: AxonDocument;
  history: HistoryStack;
  views: ProjectView[];
  activeViewId: string;
  ribbonTab: RibbonTab;
  activeTool: ToolId;
  /** Draw panel mode (Revit) while a sketch tool is active. */
  drawMode: DrawMode;
  /** Wall placement: chain consecutive segments (Revit default on). */
  wallChain: boolean;
  /** Active wall family for new walls. */
  activeFamilyId: string;
  /** Default wall height for new walls (m). */
  wallHeight: number;
  /** Selection (UI-only, not persisted in .axon). */
  selectedWallId: string | null;
  /** First click of current wall segment (preview). */
  wallPending: { x: number; y: number; z: number } | null;
  /** Cursor hover while drawing (preview). */
  wallHover: { x: number; y: number; z: number } | null;
  /** Bumps when document mutates so views re-sync. */
  documentRev: number;
  status: string;
  visualStyle: VisualStyle;
  detailLevel: DetailLevel;
  graphicScale: string;
  fitViewRequest: number;
  /** Default like Revit: both stacked on the left. */
  browserDock: DockSide;
  propertiesDock: DockSide;
  browserFloat: FloatPos;
  propertiesFloat: FloatPos;
  browserVisible: boolean;
  propertiesVisible: boolean;
  systemBrowserVisible: boolean;
  iconBarVisible: boolean;
  statusBarVisible: boolean;
  leftDockWidth: number;
  rightDockWidth: number;
  /** 0–1 share of properties vs browser when both stacked on a side */
  leftDockSplit: number;
  rightDockSplit: number;
  /** While dragging a palette — edge highlight. */
  dockPreview: DockSide | null;
  draggingPanel: PanelId | null;
  newProject: () => void;
  openDemo: () => void;
  openFromText: (text: string, fileName?: string) => void;
  exportText: () => string;
  setStatus: (status: string) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setTool: (tool: ToolId) => void;
  setDrawMode: (mode: DrawMode) => void;
  setWallChain: (chained: boolean) => void;
  /** Keep chain mode on, but end current run (next click starts a new chain). */
  splitWallChain: () => void;
  /** Turn chain off (place one segment at a time). */
  releaseWallChain: () => void;
  setActiveFamilyId: (id: string) => void;
  setWallHeight: (height: number) => void;
  setSelectedWallId: (id: string | null) => void;
  setWallHover: (p: { x: number; y: number; z: number } | null) => void;
  /** Pointer click in viewport while wall tool is active. */
  wallClick: (p: { x: number; y: number; z: number }) => void;
  cancelWallDraw: () => void;
  runUndo: () => void;
  runRedo: () => void;
  deleteSelectedWall: () => void;
  setSelectedWallHeight: (height: number) => void;
  setSelectedWallThickness: (thickness: number) => void;
  setSelectedWallFamily: (familyId: string) => void;
  setActiveView: (id: string) => void;
  ensureViewOpen: (id: string) => void;
  addView: (kind: ViewKind) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setGraphicScale: (scale: string) => void;
  requestFitView: () => void;
  setPanelDock: (id: PanelId, side: DockSide) => void;
  setPanelFloat: (id: PanelId, pos: FloatPos) => void;
  setPanelVisible: (id: PanelId, visible: boolean) => void;
  setSystemBrowserVisible: (visible: boolean) => void;
  setIconBarVisible: (visible: boolean) => void;
  setStatusBarVisible: (visible: boolean) => void;
  setLeftDockWidth: (width: number) => void;
  setRightDockWidth: (width: number) => void;
  setLeftDockSplit: (ratio: number) => void;
  setRightDockSplit: (ratio: number) => void;
  setDockPreview: (side: DockSide | null) => void;
  setDraggingPanel: (id: PanelId | null) => void;
  cycleGraphicScale: () => void;
  cycleVisualStyle: () => void;
  cycleDetailLevel: () => void;
};

function defaultViews(): ProjectView[] {
  return [
    { id: "view.plan.level1", name: "Planta Nivel 1", kind: "plan", open: true },
    { id: "view.3d.perspective", name: "Perspectiva 3D", kind: "perspective", open: true },
  ];
}

const SCALES = ["1:20", "1:50", "1:100", "1:200"] as const;
const STYLES: VisualStyle[] = ["wireframe", "hiddenLine", "shaded"];
const DETAILS: DetailLevel[] = ["coarse", "medium", "fine"];

function touchDoc(doc: AxonDocument): AxonDocument {
  return {
    ...doc,
    walls: [...doc.walls],
    storeys: [...doc.storeys],
    families: [...doc.families],
    meta: { ...doc.meta },
  };
}

function applyCommand(
  get: () => SessionState,
  set: (partial: Partial<SessionState>) => void,
  cmd: Command,
  status: string,
): void {
  const { document, history } = get();
  history.push(cmd, document);
  set({
    document: touchDoc(document),
    history,
    documentRev: get().documentRev + 1,
    status,
  });
}

export const useSessionStore = create<SessionState>((set, get) => ({
  document: createEmptyDocument(),
  history: new HistoryStack(),
  views: defaultViews(),
  activeViewId: "view.plan.level1",
  ribbonTab: "architecture",
  activeTool: "none",
  drawMode: "line",
  wallChain: true,
  activeFamilyId: "family.block-150",
  wallHeight: 2.7,
  selectedWallId: null,
  wallPending: null,
  wallHover: null,
  documentRev: 0,
  status: "Etapa 1 — elige Muro y traza en planta (cadena activa)",
  visualStyle: "shaded",
  detailLevel: "medium",
  graphicScale: "1:50",
  fitViewRequest: 0,
  browserDock: "left",
  propertiesDock: "left",
  browserFloat: { x: 72, y: 140 },
  propertiesFloat: { x: 320, y: 140 },
  browserVisible: true,
  propertiesVisible: true,
  systemBrowserVisible: false,
  iconBarVisible: true,
  statusBarVisible: true,
  leftDockWidth: 280,
  rightDockWidth: 280,
  leftDockSplit: 0.45,
  rightDockSplit: 0.45,
  dockPreview: null,
  draggingPanel: null,

  newProject: () => {
    set({
      document: createEmptyDocument(),
      history: new HistoryStack(),
      views: defaultViews(),
      activeViewId: "view.plan.level1",
      activeTool: "none",
      ribbonTab: "architecture",
      selectedWallId: null,
      wallPending: null,
      wallHover: null,
      documentRev: get().documentRev + 1,
      status: "Nuevo proyecto",
    });
  },

  openDemo: () => {
    set({
      document: createDemoDocument(),
      history: new HistoryStack(),
      views: defaultViews(),
      activeViewId: "view.plan.level1",
      activeTool: "none",
      ribbonTab: "architecture",
      selectedWallId: null,
      wallPending: null,
      wallHover: null,
      documentRev: get().documentRev + 1,
      status: "Demo — traza muros en planta",
    });
  },

  openFromText: (text, fileName) => {
    try {
      const document = parseDocument(text);
      set({
        document,
        history: new HistoryStack(),
        activeTool: "none",
        selectedWallId: null,
        wallPending: null,
        wallHover: null,
        documentRev: get().documentRev + 1,
        status: fileName ? `Abierto: ${fileName}` : "Proyecto importado",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al abrir";
      get().setStatus(message);
    }
  },

  exportText: () => serializeDocument(get().document),
  setStatus: (status) => set({ status }),
  setRibbonTab: (ribbonTab) => set({ ribbonTab }),

  setTool: (activeTool) => {
    if (activeTool === "none") {
      set({
        activeTool,
        drawMode: "line",
        ribbonTab: "modify",
        wallPending: null,
        wallHover: null,
        status: "Herramienta: ninguna",
      });
      return;
    }
    if (isSketchTool(activeTool)) {
      set({
        activeTool,
        drawMode: "line",
        wallChain: true,
        ribbonTab: "modify",
        selectedWallId: null,
        wallPending: null,
        wallHover: null,
        status:
          activeTool === "wall"
            ? "Colocar muro — clic P1, clic P2 (cadena activa)"
            : `Trazar: ${activeTool}`,
      });
      return;
    }
    set({
      activeTool,
      ribbonTab: "modify",
      wallPending: null,
      wallHover: null,
      status: `Herramienta: ${activeTool}`,
    });
  },

  setDrawMode: (drawMode) => {
    const tool = get().activeTool;
    set({
      drawMode,
      status: isSketchTool(tool)
        ? `Dibujo: ${drawMode}${tool === "wall" ? " (muro)" : ""}`
        : `Dibujo: ${drawMode}`,
    });
  },

  setWallChain: (wallChain) =>
    set({
      wallChain,
      status: wallChain
        ? "Cadena activa — cada segmento continúa desde el anterior"
        : "Cadena desactivada — un segmento por trazo",
    }),

  splitWallChain: () => {
    set({
      wallChain: true,
      wallPending: null,
      wallHover: null,
      status: "Cadena dividida — siguiente clic inicia un nuevo tramo",
    });
  },

  releaseWallChain: () => {
    set({
      wallChain: false,
      wallPending: null,
      wallHover: null,
      status: "Cadena soltada — coloca segmentos sueltos",
    });
  },

  setActiveFamilyId: (activeFamilyId) => {
    const fam = familyById(activeFamilyId);
    set({
      activeFamilyId,
      status: fam ? `Familia: ${fam.label}` : `Familia: ${activeFamilyId}`,
    });
  },

  setWallHeight: (wallHeight) => set({ wallHeight }),

  setSelectedWallId: (selectedWallId) =>
    set({
      selectedWallId,
      status: selectedWallId ? `Seleccionado: ${selectedWallId}` : "Sin selección",
    }),

  setWallHover: (wallHover) => set({ wallHover }),

  wallClick: (p) => {
    const s = get();
    if (s.activeTool !== "wall") return;
    if (s.drawMode !== "line") {
      set({ status: "Solo modo Línea está activo en Etapa 1" });
      return;
    }

    if (!s.wallPending) {
      set({
        wallPending: p,
        wallHover: p,
        status: "P1 fijado — clic para P2 (Esc cancela)",
      });
      return;
    }

    const p1 = s.wallPending;
    const len = Math.hypot(p.x - p1.x, p.y - p1.y);
    if (len < MIN_WALL_LENGTH) {
      set({ status: "Segmento demasiado corto" });
      return;
    }

    const fam = familyById(s.activeFamilyId);
    const thickness = fam?.thickness ?? 0.15;
    const storey = s.document.storeys[0];
    const wall: Wall = {
      id: createWallId(),
      storeyId: storey?.id ?? "storey.default",
      familyId: s.activeFamilyId,
      p1: { x: p1.x, y: p1.y, z: storey?.elevation ?? 0 },
      p2: { x: p.x, y: p.y, z: storey?.elevation ?? 0 },
      height: s.wallHeight,
      thickness,
    };

    applyCommand(get, set, new CreateWallCommand(wall), `Muro creado (${len.toFixed(2)} m)`);

    if (s.wallChain) {
      set({
        wallPending: { x: p.x, y: p.y, z: storey?.elevation ?? 0 },
        wallHover: { x: p.x, y: p.y, z: storey?.elevation ?? 0 },
        status: "Cadena — clic para siguiente segmento (Esc / Dividir corta)",
      });
    } else {
      set({ wallPending: null, wallHover: null });
    }
  },

  cancelWallDraw: () => {
    if (get().activeTool !== "wall") return;
    set({
      wallPending: null,
      wallHover: null,
      status: "Trazado cancelado — clic para nuevo P1",
    });
  },

  runUndo: () => {
    const { document, history } = get();
    if (!history.canUndo) return;
    history.undo(document);
    set({
      document: touchDoc(document),
      history,
      documentRev: get().documentRev + 1,
      selectedWallId: null,
      status: "Deshacer",
    });
  },

  runRedo: () => {
    const { document, history } = get();
    if (!history.canRedo) return;
    history.redo(document);
    set({
      document: touchDoc(document),
      history,
      documentRev: get().documentRev + 1,
      selectedWallId: null,
      status: "Rehacer",
    });
  },

  deleteSelectedWall: () => {
    const id = get().selectedWallId;
    if (!id) return;
    applyCommand(get, set, new DeleteWallCommand(id), `Eliminado ${id}`);
    set({ selectedWallId: null });
  },

  setSelectedWallHeight: (height) => {
    const id = get().selectedWallId;
    if (!id) return;
    applyCommand(get, set, new SetWallHeightCommand(id, height), `Altura → ${height} m`);
  },

  setSelectedWallThickness: (thickness) => {
    const id = get().selectedWallId;
    if (!id) return;
    applyCommand(get, set, new SetWallThicknessCommand(id, thickness), `Espesor → ${thickness} m`);
  },

  setSelectedWallFamily: (familyId) => {
    const id = get().selectedWallId;
    const fam = familyById(familyId);
    if (!id || !fam) return;
    applyCommand(
      get,
      set,
      new SetWallFamilyCommand(id, familyId, fam.thickness),
      `Familia → ${fam.label}`,
    );
  },

  setActiveView: (id) => {
    const view = get().views.find((v) => v.id === id);
    if (!view) return;
    set({
      activeViewId: id,
      views: get().views.map((v) => (v.id === id ? { ...v, open: true } : v)),
      status:
        view.kind === "plan"
          ? `Vista ortogonal: ${view.name}`
          : `Vista activa: ${view.name}`,
    });
  },

  ensureViewOpen: (id) => get().setActiveView(id),

  addView: (kind) => {
    const n = get().views.filter((v) => v.kind === kind).length + 1;
    const id = `view.${kind}.${n}`;
    const name = kind === "plan" ? `Planta ${n}` : `3D ${n}`;
    const view: ProjectView = { id, name, kind, open: true };
    set({
      views: [...get().views, view],
      activeViewId: id,
      ribbonTab: "view",
      status: `Vista creada: ${name}`,
    });
  },

  setVisualStyle: (visualStyle) => set({ visualStyle, status: `Estilo: ${visualStyle}` }),
  setDetailLevel: (detailLevel) => set({ detailLevel, status: `Detalle: ${detailLevel}` }),
  setGraphicScale: (graphicScale) => set({ graphicScale, status: `Escala: ${graphicScale}` }),
  requestFitView: () => set({ fitViewRequest: get().fitViewRequest + 1 }),

  setPanelDock: (id, side) => {
    if (id === "browser") set({ browserDock: side, browserVisible: true });
    else set({ propertiesDock: side, propertiesVisible: true });
  },
  setPanelFloat: (id, pos) => {
    if (id === "browser") set({ browserFloat: pos });
    else set({ propertiesFloat: pos });
  },
  setPanelVisible: (id, visible) => {
    if (id === "browser") set({ browserVisible: visible });
    else set({ propertiesVisible: visible });
  },
  setSystemBrowserVisible: (systemBrowserVisible) => set({ systemBrowserVisible }),
  setIconBarVisible: (iconBarVisible) => set({ iconBarVisible }),
  setStatusBarVisible: (statusBarVisible) => set({ statusBarVisible }),
  setLeftDockWidth: (leftDockWidth) =>
    set({ leftDockWidth: Math.min(560, Math.max(180, Math.round(leftDockWidth))) }),
  setRightDockWidth: (rightDockWidth) =>
    set({ rightDockWidth: Math.min(560, Math.max(180, Math.round(rightDockWidth))) }),
  setLeftDockSplit: (leftDockSplit) =>
    set({ leftDockSplit: Math.min(0.8, Math.max(0.2, leftDockSplit)) }),
  setRightDockSplit: (rightDockSplit) =>
    set({ rightDockSplit: Math.min(0.8, Math.max(0.2, rightDockSplit)) }),
  setDockPreview: (dockPreview) => set({ dockPreview }),
  setDraggingPanel: (draggingPanel) => set({ draggingPanel }),

  cycleGraphicScale: () => {
    const cur = get().graphicScale;
    const i = SCALES.indexOf(cur as (typeof SCALES)[number]);
    get().setGraphicScale(SCALES[(i + 1) % SCALES.length] ?? SCALES[0]);
  },
  cycleVisualStyle: () => {
    const i = STYLES.indexOf(get().visualStyle);
    get().setVisualStyle(STYLES[(i + 1) % STYLES.length] ?? STYLES[0]);
  },
  cycleDetailLevel: () => {
    const i = DETAILS.indexOf(get().detailLevel);
    get().setDetailLevel(DETAILS[(i + 1) % DETAILS.length] ?? DETAILS[0]);
  },
}));
