import type { CameraPreset } from "@axonbim/viewer";
import {
  nextDetailLevel,
  nextGraphicScale,
  nextVisualStyle,
} from "./displayCycles.js";
import type {
  DetailLevel,
  DockSide,
  FloatPos,
  OrbitPivotMode,
  PanelId,
  RibbonTab,
  VisualStyle,
} from "./sessionTypes.js";
import type { SessionSliceCreator } from "./sliceTypes.js";

export const createShellSlice: SessionSliceCreator<{
  ribbonTab: RibbonTab;
  status: string;
  visualStyle: VisualStyle;
  detailLevel: DetailLevel;
  graphicScale: string;
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
  leftDockSplit: number;
  rightDockSplit: number;
  dockPreview: DockSide | null;
  draggingPanel: PanelId | null;
  setStatus: (status: string) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setVisualStyle: (style: VisualStyle) => void;
  setDetailLevel: (level: DetailLevel) => void;
  setGraphicScale: (scale: string) => void;
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
}> = (set, get) => ({
  ribbonTab: "architecture",
  status: "MVP — Muro: snap orto/extremos/cierre · Shift = orto forzado",
  visualStyle: "shaded",
  detailLevel: "medium",
  graphicScale: "1:50",
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

  setStatus: (status) => set({ status }),
  setRibbonTab: (ribbonTab) => set({ ribbonTab }),
  setVisualStyle: (visualStyle) => set({ visualStyle, status: `Estilo: ${visualStyle}` }),
  setDetailLevel: (detailLevel) => set({ detailLevel, status: `Detalle: ${detailLevel}` }),
  setGraphicScale: (graphicScale) => set({ graphicScale, status: `Escala: ${graphicScale}` }),

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
    get().setGraphicScale(nextGraphicScale(get().graphicScale));
  },
  cycleVisualStyle: () => {
    get().setVisualStyle(nextVisualStyle(get().visualStyle));
  },
  cycleDetailLevel: () => {
    get().setDetailLevel(nextDetailLevel(get().detailLevel));
  },
});

export const createViewportBridgeSlice: SessionSliceCreator<{
  fitViewRequest: number;
  cameraPresetRequest: number;
  cameraPreset: CameraPreset | null;
  orbitPivotMode: OrbitPivotMode;
  orbitPivotRequest: number;
  requestFitView: () => void;
  requestCameraPreset: (preset: CameraPreset) => void;
  setOrbitPivotMode: (mode: OrbitPivotMode) => void;
  syncOrbitPivot: () => void;
}> = (set, get) => ({
  fitViewRequest: 0,
  cameraPresetRequest: 0,
  cameraPreset: null,
  orbitPivotMode: "model",
  orbitPivotRequest: 0,

  requestFitView: () => set({ fitViewRequest: get().fitViewRequest + 1 }),

  requestCameraPreset: (preset) => {
    const labels: Record<CameraPreset, string> = {
      top: "Superior (orto)",
      bottom: "Inferior (orto)",
      front: "Frontal (orto)",
      back: "Posterior (orto)",
      left: "Izquierda (orto)",
      right: "Derecha (orto)",
      iso: "Isométrica (perspectiva)",
    };
    set({
      cameraPreset: preset,
      cameraPresetRequest: get().cameraPresetRequest + 1,
      status: `Vista 3D: ${labels[preset]}`,
    });
  },

  setOrbitPivotMode: (orbitPivotMode) => {
    set({
      orbitPivotMode,
      status:
        orbitPivotMode === "selection"
          ? "Órbita: pivot en selección (sin selección → modelo)"
          : "Órbita: pivot en centro del modelo",
    });
    get().syncOrbitPivot();
  },

  syncOrbitPivot: () => {
    set({ orbitPivotRequest: get().orbitPivotRequest + 1 });
  },
});
