import { HistoryStack } from "@axonbim/commands";
import {
  createDemoDocument,
  createEmptyDocument,
  type AxonDocument,
} from "@axonbim/model";
import { parseDocument, serializeDocument } from "@axonbim/persistence";
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

export const useSessionStore = create<SessionState>((set, get) => ({
  document: createEmptyDocument(),
  history: new HistoryStack(),
  views: defaultViews(),
  activeViewId: "view.3d.perspective",
  ribbonTab: "architecture",
  activeTool: "none",
  drawMode: "line",
  wallChain: true,
  status: "Arrastra paneles o usa ◧ ▢ ◨ en el título — acople izq./der./flotante",
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
      activeViewId: "view.3d.perspective",
      activeTool: "none",
      ribbonTab: "architecture",
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
      ribbonTab: "view",
      status: "Demo — planta ortogonal activa",
    });
  },

  openFromText: (text, fileName) => {
    try {
      const document = parseDocument(text);
      set({
        document,
        history: new HistoryStack(),
        activeTool: "none",
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
        status:
          activeTool === "wall"
            ? "Colocar muro — cadena activa (Modificar → Cadena)"
            : `Trazar: ${activeTool}`,
      });
      return;
    }
    set({
      activeTool,
      ribbonTab: "modify",
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
    // Etapa 1 will end the current polyline and start a new chained run.
    set({
      wallChain: true,
      status: "Cadena dividida — siguiente clic inicia un nuevo tramo encadenado",
    });
  },

  releaseWallChain: () => {
    set({
      wallChain: false,
      status: "Cadena soltada — coloca segmentos sueltos",
    });
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
