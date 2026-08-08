import {
  CreateCameraCommand,
  CreateDoorCommand,
  CreateWallCommand,
  CreateWindowCommand,
  DeleteCameraCommand,
  DeleteDoorCommand,
  DeleteWallCommand,
  DeleteWindowCommand,
  HistoryStack,
  SetCameraCropCommand,
  SetCameraEyeHeightCommand,
  SetCameraFovCommand,
  SetCameraNameCommand,
  TranslateCameraPlanCommand,
  SetDoorFamilyCommand,
  SetDoorHingeCommand,
  SetDoorLeafStateCommand,
  SetDoorSwingCommand,
  SetWallFamilyCommand,
  SetWallHeightCommand,
  SetWallThicknessCommand,
  SetWindowFamilyCommand,
  SetWindowHingeCommand,
  SetWindowLeafStateCommand,
  SetWindowSwingCommand,
  createCameraId,
  createDoorId,
  createWallId,
  createWindowId,
  syncIdSequencesFromDocument,
  type Command,
} from "@axonbim/commands";
import { doorFamilyById, familyById, windowFamilyById } from "@axonbim/families";
import {
  cloneViewCrop,
  createDemoDocument,
  createEmptyDocument,
  defaultCameraCrop,
  normalizeViewCrop,
  resizeViewCropCorner,
  type AxonDocument,
  type Camera,
  type CropCorner,
  type Door,
  type DoorLeafState,
  type DoorSwing,
  type ViewCrop,
  type Wall,
  type Window,
} from "@axonbim/model";
import { parseDocument, serializeDocument } from "@axonbim/persistence";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { DrawMode, SnapKind, ToolId } from "@axonbim/tools";
import { collectEndpoints, isCameraTool, isSketchTool, snapWallPoint } from "@axonbim/tools";
import { projectPointOnWall } from "@axonbim/geometry";
import type { CameraPreset } from "@axonbim/viewer";
import { create } from "zustand";
import {
  defaultSessionViewCrop,
  resolveActiveViewCrop,
  resolveClippingCrop,
} from "./session/viewCropResolve";
import {
  beginCameraFrameMoveDrag,
  beginCornerCropDrag,
  resolveCropDragCommit,
  updateCropDragLive,
  type CropDragMeta,
} from "./session/viewCropDrag";
import {
  DEFAULT_CAMERA_EYE_Z,
  DEFAULT_CAMERA_FOV,
  type DetailLevel,
  type DockSide,
  type FloatPos,
  type OrbitPivotMode,
  type PanelId,
  type ProjectView,
  type RibbonTab,
  type ViewKind,
  type VisualStyle,
} from "./session/sessionTypes";
import { defaultViews } from "./session/defaultViews";
import {
  nextDetailLevel,
  nextGraphicScale,
  nextVisualStyle,
} from "./session/displayCycles";
import { touchDoc } from "./session/touchDoc";

export type {
  DetailLevel,
  DockSide,
  FloatPos,
  OrbitPivotMode,
  PanelId,
  ProjectView,
  RibbonTab,
  ViewKind,
  VisualStyle,
} from "./session/sessionTypes";
export { DEFAULT_CAMERA_EYE_Z, DEFAULT_CAMERA_FOV } from "./session/sessionTypes";

type SessionState = {
  document: AxonDocument;
  history: HistoryStack;
  views: ProjectView[];
  activeViewId: string;
  ribbonTab: RibbonTab;
  activeTool: ToolId;
  /** Draw panel mode while a sketch tool is active. */
  drawMode: DrawMode;
  /** Wall placement: chain consecutive segments (default on). */
  wallChain: boolean;
  /** Active wall family for new walls. */
  activeFamilyId: string;
  /** Default wall height for new walls (m). */
  wallHeight: number;
  /** Selection (UI-only, not persisted in .axon). */
  selectedWallId: string | null;
  selectedDoorId: string | null;
  selectedWindowId: string | null;
  selectedCameraId: string | null;
  /**
   * Camera whose crop frame is selected in plan (grips + move).
   * Only for camera crops — not session plan crop.
   */
  selectedCropFrameCameraId: string | null;
  /** Live crop while dragging a plan grip (not yet committed to history). */
  cropDragLive: ViewCrop | null;
  cropDragMeta: CropDragMeta | null;
  /** Live camera pose while dragging the crop frame (move mode). */
  cameraPoseDragLive: {
    cameraId: string;
    eye: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  } | null;
  /** Active door family for placement. */
  activeDoorFamilyId: string;
  /** Active window family for placement. */
  activeWindowFamilyId: string;
  /** First click of current wall segment (preview). */
  wallPending: { x: number; y: number; z: number } | null;
  /** Start of current chained run (for close snap). */
  wallChainOrigin: { x: number; y: number; z: number } | null;
  /** Cursor hover while drawing (preview). */
  wallHover: { x: number; y: number; z: number } | null;
  /** Last snap kind (status / UI). */
  lastSnapKind: SnapKind;
  /** Master snap on/off (status bar switch). */
  snapEnabled: boolean;
  /** Bumps when document mutates so views re-sync. */
  documentRev: number;
  status: string;
  visualStyle: VisualStyle;
  detailLevel: DetailLevel;
  graphicScale: string;
  fitViewRequest: number;
  cameraPresetRequest: number;
  cameraPreset: CameraPreset | null;
  /** Orbit pivot: model bbox center vs selected element. */
  orbitPivotMode: OrbitPivotMode;
  /** Bumps when pivot should be re-applied to the viewer. */
  orbitPivotRequest: number;
  /** Default: both stacked on the left. */
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
  setSnapEnabled: (enabled: boolean) => void;
  /** Keep chain mode on, but end current run (next click starts a new chain). */
  splitWallChain: () => void;
  /** Turn chain off (place one segment at a time). */
  releaseWallChain: () => void;
  setActiveFamilyId: (id: string) => void;
  setWallHeight: (height: number) => void;
  setSelectedWallId: (id: string | null) => void;
  setSelectedDoorId: (id: string | null) => void;
  setSelectedWindowId: (id: string | null) => void;
  setSelectedCameraId: (id: string | null) => void;
  setSelectedCropFrameCameraId: (id: string | null) => void;
  setActiveDoorFamilyId: (id: string) => void;
  setActiveWindowFamilyId: (id: string) => void;
  /** Place door on wall at world point (projected to axis). */
  placeDoorOnWall: (wallId: string, world: { x: number; y: number }) => void;
  /** Place window on wall at world point (projected to axis). */
  placeWindowOnWall: (wallId: string, world: { x: number; y: number }) => void;
  setWallHover: (p: { x: number; y: number; z: number } | null, forceOrtho?: boolean) => void;
  /** Pointer click in viewport while wall tool is active. */
  wallClick: (p: { x: number; y: number; z: number }, forceOrtho?: boolean) => void;
  /** Camera tool: eye (1st click) → target (2nd click) in plan. */
  cameraClick: (p: { x: number; y: number; z: number }) => void;
  cancelWallDraw: () => void;
  runUndo: () => void;
  runRedo: () => void;
  deleteSelectedWall: () => void;
  deleteSelectedDoor: () => void;
  deleteSelectedWindow: () => void;
  deleteSelectedCamera: () => void;
  setSelectedCameraName: (name: string) => void;
  setSelectedCameraFov: (fov: number) => void;
  setSelectedCameraEyeHeight: (z: number) => void;
  setSelectedCameraCrop: (crop: ViewCrop) => void;
  /** Crop shown/edited in props (camera if selected or camera view; else session). */
  getActiveViewCrop: () => ViewCrop | null;
  /**
   * Crop that actually clips geometry for the active view.
   * Plan/perspective → session ProjectView.crop only.
   * Camera view → that Camera.crop. Never clips plan with a camera crop.
   */
  getClippingCrop: () => ViewCrop | null;
  setActiveViewCropEnabled: (enabled: boolean) => void;
  setActiveViewCropSize: (width: number, depth: number) => void;
  setActiveViewCrop: (crop: ViewCrop) => void;
  resizeActiveViewCropCorner: (corner: CropCorner, x: number, y: number) => void;
  beginCropDrag: (cameraId: string | null, corner: CropCorner) => void;
  beginCameraFrameMove: (cameraId: string, x: number, y: number) => void;
  updateCropDrag: (x: number, y: number) => void;
  commitCropDrag: () => void;
  cancelCropDrag: () => void;
  setSelectedDoorLeafState: (state: DoorLeafState) => void;
  setSelectedDoorSwing: (swing: DoorSwing) => void;
  flipSelectedDoorSwing: () => void;
  flipSelectedDoorHinge: () => void;
  setSelectedDoorHinge: (hinge: Door["hinge"]) => void;
  setSelectedDoorFamily: (familyId: string) => void;
  setSelectedWindowLeafState: (state: DoorLeafState) => void;
  setSelectedWindowSwing: (swing: DoorSwing) => void;
  flipSelectedWindowSwing: () => void;
  flipSelectedWindowHinge: () => void;
  setSelectedWindowHinge: (hinge: Window["hinge"]) => void;
  setSelectedWindowFamily: (familyId: string) => void;
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
  requestCameraPreset: (preset: CameraPreset) => void;
  setOrbitPivotMode: (mode: OrbitPivotMode) => void;
  /** Recompute and push orbit pivot to the 3D viewport. */
  syncOrbitPivot: () => void;
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

function applyCommand(
  get: () => SessionState,
  set: (partial: Partial<SessionState>) => void,
  cmd: Command,
  status: string,
): void {
  const { document, history } = get();
  const mutated = history.push(cmd, document);
  if (!mutated) {
    set({ status: "Sin cambios (operación no aplicada)" });
    return;
  }
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
  selectedDoorId: null,
  selectedWindowId: null,
  selectedCameraId: null,
  selectedCropFrameCameraId: null,
  cropDragLive: null,
  cropDragMeta: null,
  cameraPoseDragLive: null,
  activeDoorFamilyId: "family.door-90",
  activeWindowFamilyId: "family.window-90x120",
  wallPending: null,
  wallChainOrigin: null,
  wallHover: null,
  lastSnapKind: "none",
  snapEnabled: true,
  documentRev: 0,
  status: "MVP — Muro: snap orto/extremos/cierre · Shift = orto forzado",
  visualStyle: "shaded",
  detailLevel: "medium",
  graphicScale: "1:50",
  fitViewRequest: 0,
  cameraPresetRequest: 0,
  cameraPreset: null,
  orbitPivotMode: "model",
  orbitPivotRequest: 0,
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
  setStatus: (status) => set({ status }),
  setRibbonTab: (ribbonTab) => set({ ribbonTab }),

  setTool: (activeTool) => {
    if (activeTool === "none") {
      set({
        activeTool,
        drawMode: "line",
        ribbonTab: "modify",
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        status: "Herramienta: ninguna",
      });
      return;
    }
    if (activeTool === "door") {
      set({
        activeTool,
        ribbonTab: "modify",
        selectedWallId: null,
        selectedDoorId: null,
        selectedWindowId: null,
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        status: "Colocar puerta — clic en un muro",
      });
      return;
    }
    if (activeTool === "window") {
      set({
        activeTool,
        ribbonTab: "modify",
        selectedWallId: null,
        selectedDoorId: null,
        selectedWindowId: null,
        selectedCameraId: null,
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        status: "Colocar ventana — clic en un muro",
      });
      return;
    }
    if (isCameraTool(activeTool)) {
      set({
        activeTool,
        ribbonTab: "view",
        selectedWallId: null,
        selectedDoorId: null,
        selectedWindowId: null,
        selectedCameraId: null,
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        status: "Cámara — clic 1: ojo · clic 2: mira (en planta)",
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
        selectedDoorId: null,
        selectedWindowId: null,
        selectedCameraId: null,
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        status:
          activeTool === "wall"
            ? "Colocar muro — snap extremos/orto/cierre (Shift = orto)"
            : `Trazar: ${activeTool}`,
      });
      return;
    }
    set({
      activeTool,
      ribbonTab: "modify",
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
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

  setSnapEnabled: (snapEnabled) =>
    set({
      snapEnabled,
      lastSnapKind: "none",
      status: snapEnabled
        ? "Snap activo — extremos / orto / cierre"
        : "Snap desactivado",
    }),

  splitWallChain: () => {
    set({
      wallChain: true,
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
      status: "Cadena dividida — siguiente clic inicia un nuevo tramo",
    });
  },

  releaseWallChain: () => {
    set({
      wallChain: false,
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
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

  setSelectedWallId: (selectedWallId) => {
    set({
      selectedWallId,
      selectedDoorId: null,
      selectedWindowId: null,
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
      status: selectedWallId ? `Seleccionado: ${selectedWallId}` : "Sin selección",
    });
    get().syncOrbitPivot();
  },

  setSelectedDoorId: (selectedDoorId) => {
    set({
      selectedDoorId,
      selectedWallId: null,
      selectedWindowId: null,
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
      status: selectedDoorId ? `Puerta: ${selectedDoorId}` : "Sin selección",
    });
    get().syncOrbitPivot();
  },

  setSelectedWindowId: (selectedWindowId) => {
    set({
      selectedWindowId,
      selectedWallId: null,
      selectedDoorId: null,
      selectedCameraId: null,
      selectedCropFrameCameraId: null,
      status: selectedWindowId ? `Ventana: ${selectedWindowId}` : "Sin selección",
    });
    get().syncOrbitPivot();
  },

  setSelectedCameraId: (selectedCameraId) => {
    set({
      selectedCameraId,
      selectedCropFrameCameraId: null,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      status: selectedCameraId ? `Cámara: ${selectedCameraId}` : "Sin selección",
    });
  },

  setSelectedCropFrameCameraId: (id) => {
    if (!id) {
      set({ selectedCropFrameCameraId: null });
      return;
    }
    set({
      selectedCropFrameCameraId: id,
      selectedCameraId: id,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      status: `Marco de recorte: ${id} — arrastra marco o grips`,
    });
  },

  setActiveDoorFamilyId: (activeDoorFamilyId) => {
    const fam = doorFamilyById(activeDoorFamilyId);
    set({
      activeDoorFamilyId,
      status: fam ? `Familia puerta: ${fam.label}` : `Familia: ${activeDoorFamilyId}`,
    });
  },

  setActiveWindowFamilyId: (activeWindowFamilyId) => {
    const fam = windowFamilyById(activeWindowFamilyId);
    set({
      activeWindowFamilyId,
      status: fam ? `Familia ventana: ${fam.label}` : `Familia: ${activeWindowFamilyId}`,
    });
  },

  placeDoorOnWall: (wallId, world) => {
    const s = get();
    const wall = s.document.walls.find((w) => w.id === wallId);
    if (!wall) {
      set({ status: "Muro no encontrado" });
      return;
    }
    const fam = doorFamilyById(s.activeDoorFamilyId);
    const width = fam?.width ?? 0.9;
    const height = fam?.height ?? 2.1;
    const len = Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y);
    const { offset } = projectPointOnWall(wall, world);
    const half = width / 2;
    if (offset < half + 0.05 || offset > len - half - 0.05) {
      set({ status: "Puerta demasiado cerca del extremo del muro" });
      return;
    }
    // Avoid overlap with existing doors on same wall
    const overlap = s.document.doors.some((d) => {
      if (d.wallId !== wallId) return false;
      return Math.abs(d.centerOffset - offset) < (d.width + width) / 2 + 0.02;
    });
    if (overlap) {
      set({ status: "Hay otra puerta demasiado cerca" });
      return;
    }
    if (height > wall.height - 0.05) {
      set({ status: "La puerta es más alta que el muro" });
      return;
    }
    const door: Door = {
      id: createDoorId(),
      wallId,
      familyId: s.activeDoorFamilyId,
      centerOffset: offset,
      width,
      height: Math.min(height, wall.height - 0.05),
      sill: 0,
      hinge: "start",
      swing: "positive",
      leafState: "open",
    };
    applyCommand(get, set, new CreateDoorCommand(door), `Puerta ${width.toFixed(2)} m`);
    set({ selectedDoorId: door.id, selectedWallId: null, selectedWindowId: null });
  },

  placeWindowOnWall: (wallId, world) => {
    const s = get();
    const wall = s.document.walls.find((w) => w.id === wallId);
    if (!wall) {
      set({ status: "Muro no encontrado" });
      return;
    }
    const fam = windowFamilyById(s.activeWindowFamilyId);
    const width = fam?.width ?? 0.9;
    const height = fam?.height ?? 1.2;
    const sill = fam?.sill ?? 0.9;
    const len = Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y);
    const { offset } = projectPointOnWall(wall, world);
    const half = width / 2;
    if (offset < half + 0.05 || offset > len - half - 0.05) {
      set({ status: "Ventana demasiado cerca del extremo del muro" });
      return;
    }
    const overlapsDoor = s.document.doors.some((d) => {
      if (d.wallId !== wallId) return false;
      return Math.abs(d.centerOffset - offset) < (d.width + width) / 2 + 0.02;
    });
    const overlapsWindow = s.document.windows.some((w) => {
      if (w.wallId !== wallId) return false;
      return Math.abs(w.centerOffset - offset) < (w.width + width) / 2 + 0.02;
    });
    if (overlapsDoor || overlapsWindow) {
      set({ status: "Hay otro hueco demasiado cerca" });
      return;
    }
    if (sill + height > wall.height - 0.05) {
      set({ status: "La ventana no cabe en la altura del muro" });
      return;
    }
    const win: Window = {
      id: createWindowId(),
      wallId,
      familyId: s.activeWindowFamilyId,
      centerOffset: offset,
      width,
      height,
      sill,
      hinge: "start",
      swing: "positive",
      leafState: "closed",
    };
    applyCommand(get, set, new CreateWindowCommand(win), `Ventana ${width.toFixed(2)} m`);
    set({ selectedWindowId: win.id, selectedWallId: null, selectedDoorId: null });
  },

  setWallHover: (raw, forceOrtho = false) => {
    if (!raw) {
      set({ wallHover: null, lastSnapKind: "none" });
      return;
    }
    const s = get();
    if (!s.snapEnabled) {
      set({ wallHover: raw, lastSnapKind: "none" });
      return;
    }
    const snap = snapWallPoint({
      raw,
      pending: s.wallPending,
      chainOrigin: s.wallChainOrigin,
      endpoints: collectEndpoints(s.document.walls),
      forceOrtho,
    });
    set({ wallHover: snap.point, lastSnapKind: snap.kind });
  },

  wallClick: (raw, forceOrtho = false) => {
    const s = get();
    if (s.activeTool !== "wall") return;
    if (s.drawMode !== "line") {
      set({ status: "Solo modo Línea está activo en el MVP" });
      return;
    }

    const snap = s.snapEnabled
      ? snapWallPoint({
          raw,
          pending: s.wallPending,
          chainOrigin: s.wallChainOrigin,
          endpoints: collectEndpoints(s.document.walls),
          forceOrtho,
        })
      : { point: raw, kind: "none" as const, closed: false };
    const p = snap.point;

    if (!s.wallPending) {
      set({
        wallPending: p,
        wallChainOrigin: s.wallChainOrigin ?? p,
        wallHover: p,
        lastSnapKind: snap.kind,
        status:
          snap.kind === "endpoint"
            ? "P1 en extremo — clic P2 (Esc cancela)"
            : "P1 fijado — clic P2 · snap orto/extremos/cierre",
      });
      return;
    }

    const p1 = s.wallPending;
    const len = Math.hypot(p.x - p1.x, p.y - p1.y);
    if (len < MIN_WALL_LENGTH) {
      set({ status: "Segmento demasiado corto", lastSnapKind: snap.kind });
      return;
    }

    const fam = familyById(s.activeFamilyId);
    const thickness = fam?.thickness ?? 0.15;
    const storey = s.document.storeys[0];
    const elev = storey?.elevation ?? 0;
    const wall: Wall = {
      id: createWallId(),
      storeyId: storey?.id ?? "storey.default",
      familyId: s.activeFamilyId,
      p1: { x: p1.x, y: p1.y, z: elev },
      p2: { x: p.x, y: p.y, z: elev },
      height: s.wallHeight,
      thickness,
    };

    const snapLabel =
      snap.kind === "close"
        ? "cierre"
        : snap.kind === "endpoint"
          ? "extremo"
          : snap.kind === "ortho"
            ? "orto"
            : "libre";
    applyCommand(
      get,
      set,
      new CreateWallCommand(wall),
      `Muro ${len.toFixed(2)} m (${snapLabel})`,
    );

    if (snap.closed || !s.wallChain) {
      set({
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        status: snap.closed
          ? "Espacio cerrado — clic para nuevo trazo"
          : "Segmento colocado",
      });
    } else {
      set({
        wallPending: { x: p.x, y: p.y, z: elev },
        wallHover: { x: p.x, y: p.y, z: elev },
        lastSnapKind: snap.kind,
        status: "Cadena — siguiente segmento (cierre cerca del origen)",
      });
    }
  },

  cameraClick: (p) => {
    const s = get();
    if (!isCameraTool(s.activeTool)) return;
    const eyeZ = DEFAULT_CAMERA_EYE_Z;

    if (!s.wallPending) {
      set({
        wallPending: { x: p.x, y: p.y, z: eyeZ },
        wallHover: { x: p.x, y: p.y, z: eyeZ },
        status: "Cámara — clic 2: dirección de mira",
      });
      return;
    }

    const eye = s.wallPending;
    const dist = Math.hypot(p.x - eye.x, p.y - eye.y);
    if (dist < 0.2) {
      set({ status: "Mira demasiado cerca del ojo — elige otro punto" });
      return;
    }

    const n = s.document.cameras.length + 1;
    const id = createCameraId();
    const eyePos = { x: eye.x, y: eye.y, z: eyeZ };
    const targetPos = { x: p.x, y: p.y, z: eyeZ };
    const camera: Camera = {
      id,
      name: `Cámara ${n}`,
      eye: eyePos,
      target: targetPos,
      fov: DEFAULT_CAMERA_FOV,
      crop: defaultCameraCrop(eyePos, targetPos, DEFAULT_CAMERA_FOV),
    };
    applyCommand(get, set, new CreateCameraCommand(camera), `Cámara creada: ${camera.name}`);

    const viewId = `view.camera.${id}`;
    const view: ProjectView = {
      id: viewId,
      name: camera.name,
      kind: "camera",
      open: true,
      cameraId: id,
    };
    set({
      views: [...get().views.filter((v) => v.id !== viewId), view],
      activeViewId: viewId,
      selectedCameraId: id,
      selectedWallId: null,
      selectedDoorId: null,
      selectedWindowId: null,
      wallPending: null,
      wallHover: null,
      activeTool: "none",
      status: `${camera.name} — vista 3D abierta (independiente de Perspectiva 3D)`,
    });
  },

  cancelWallDraw: () => {
    const tool = get().activeTool;
    if (tool !== "wall" && tool !== "camera") return;
    set({
      wallPending: null,
      wallChainOrigin: null,
      wallHover: null,
      lastSnapKind: "none",
      status:
        tool === "camera"
          ? "Cámara cancelada — clic 1 para ojo"
          : "Trazado cancelado — clic para nuevo P1",
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
      selectedDoorId: null,
      selectedWindowId: null,
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
      selectedDoorId: null,
      selectedWindowId: null,
      status: "Rehacer",
    });
  },

  deleteSelectedWall: () => {
    const id = get().selectedWallId;
    if (!id) return;
    applyCommand(get, set, new DeleteWallCommand(id), `Eliminado ${id}`);
    set({ selectedWallId: null, selectedDoorId: null, selectedWindowId: null });
  },

  deleteSelectedDoor: () => {
    const id = get().selectedDoorId;
    if (!id) return;
    applyCommand(get, set, new DeleteDoorCommand(id), `Puerta eliminada ${id}`);
    set({ selectedDoorId: null });
  },

  deleteSelectedWindow: () => {
    const id = get().selectedWindowId;
    if (!id) return;
    applyCommand(get, set, new DeleteWindowCommand(id), `Ventana eliminada ${id}`);
    set({ selectedWindowId: null });
  },

  deleteSelectedCamera: () => {
    const id = get().selectedCameraId;
    if (!id) return;
    applyCommand(get, set, new DeleteCameraCommand(id), `Cámara eliminada ${id}`);
    const views = get().views.filter((v) => v.cameraId !== id);
    const activeGone = !views.some((v) => v.id === get().activeViewId);
    set({
      selectedCameraId: null,
      views,
      activeViewId: activeGone ? (views[0]?.id ?? "view.plan.level1") : get().activeViewId,
    });
  },

  setSelectedCameraName: (name) => {
    const id = get().selectedCameraId;
    if (!id || !name.trim()) return;
    applyCommand(get, set, new SetCameraNameCommand(id, name.trim()), `Nombre → ${name.trim()}`);
    set({
      views: get().views.map((v) =>
        v.cameraId === id ? { ...v, name: name.trim() } : v,
      ),
    });
  },

  setSelectedCameraFov: (fov) => {
    const id = get().selectedCameraId;
    if (!id) return;
    const clamped = Math.min(120, Math.max(10, fov));
    applyCommand(get, set, new SetCameraFovCommand(id, clamped), `FOV → ${clamped}°`);
  },

  setSelectedCameraEyeHeight: (z) => {
    const id = get().selectedCameraId;
    if (!id) return;
    applyCommand(get, set, new SetCameraEyeHeightCommand(id, z), `Altura ojo → ${z.toFixed(2)} m`);
  },

  setSelectedCameraCrop: (crop) => {
    const id = get().selectedCameraId;
    if (!id) return;
    applyCommand(
      get,
      set,
      new SetCameraCropCommand(id, crop),
      crop.enabled ? "Recorte de cámara actualizado" : "Recorte de cámara desactivado",
    );
  },

  getActiveViewCrop: () => {
    const s = get();
    return resolveActiveViewCrop({
      views: s.views,
      activeViewId: s.activeViewId,
      documentCameras: s.document.cameras,
      selectedCameraId: s.selectedCameraId,
      cropDragLive: s.cropDragLive,
      cropDragMeta: s.cropDragMeta,
    });
  },

  getClippingCrop: () => {
    const s = get();
    return resolveClippingCrop({
      views: s.views,
      activeViewId: s.activeViewId,
      documentCameras: s.document.cameras,
      selectedCameraId: s.selectedCameraId,
      cropDragLive: s.cropDragLive,
      cropDragMeta: s.cropDragMeta,
    });
  },

  setActiveViewCropEnabled: (enabled) => {
    const s = get();
    const view = s.views.find((v) => v.id === s.activeViewId);
    if (!view) return;

    if (view.kind === "camera" && view.cameraId) {
      const cam = s.document.cameras.find((c) => c.id === view.cameraId);
      if (!cam) return;
      const next = cloneViewCrop(cam.crop);
      next.enabled = enabled;
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(view.cameraId, next),
        enabled ? "Recortar vista: sí" : "Recortar vista: no",
      );
      return;
    }

    if (s.selectedCameraId && view.kind === "plan") {
      const cam = s.document.cameras.find((c) => c.id === s.selectedCameraId);
      if (cam) {
        const next = cloneViewCrop(cam.crop);
        next.enabled = enabled;
        applyCommand(
          get,
          set,
          new SetCameraCropCommand(cam.id, next),
          enabled ? "Recortar vista: sí" : "Recortar vista: no",
        );
        return;
      }
    }

    const base =
      view.crop ??
      defaultSessionViewCrop(s.document.walls);
    const next = normalizeViewCrop({ ...base, enabled });
    set({
      views: s.views.map((v) => (v.id === view.id ? { ...v, crop: next } : v)),
      status: enabled ? "Recortar vista: sí" : "Recortar vista: no",
    });
  },

  setActiveViewCropSize: (width, depth) => {
    const w = Math.max(0.5, width);
    const d = Math.max(0.5, depth);
    const crop = get().getActiveViewCrop();
    if (!crop) {
      get().setActiveViewCropEnabled(true);
    }
    const cur = get().getActiveViewCrop();
    if (!cur) return;
    const cx = (cur.minX + cur.maxX) / 2;
    const cy = (cur.minY + cur.maxY) / 2;
    get().setActiveViewCrop(
      normalizeViewCrop({
        ...cur,
        enabled: true,
        minX: cx - w / 2,
        maxX: cx + w / 2,
        minY: cy - d / 2,
        maxY: cy + d / 2,
      }),
    );
  },

  setActiveViewCrop: (crop) => {
    const s = get();
    const view = s.views.find((v) => v.id === s.activeViewId);
    if (!view) return;
    const next = normalizeViewCrop(crop);

    if (view.kind === "camera" && view.cameraId) {
      applyCommand(get, set, new SetCameraCropCommand(view.cameraId, next), "Recorte actualizado");
      return;
    }
    if (s.selectedCameraId && view.kind === "plan") {
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(s.selectedCameraId, next),
        "Recorte de cámara actualizado",
      );
      return;
    }
    set({
      views: s.views.map((v) => (v.id === view.id ? { ...v, crop: next } : v)),
      status: "Recorte de vista actualizado",
    });
  },

  resizeActiveViewCropCorner: (corner, x, y) => {
    const crop = get().getActiveViewCrop();
    if (!crop?.enabled) return;
    get().setActiveViewCrop(resizeViewCropCorner(crop, corner, x, y));
  },

  beginCropDrag: (cameraId, corner) => {
    const s = get();
    const start = beginCornerCropDrag({
      cameraId,
      corner,
      activeViewId: s.activeViewId,
      cameras: s.document.cameras,
      views: s.views,
      selectedCameraId: s.selectedCameraId,
      selectedCropFrameCameraId: s.selectedCropFrameCameraId,
    });
    if (!start) return;
    set(start);
  },

  beginCameraFrameMove: (cameraId, x, y) => {
    const start = beginCameraFrameMoveDrag({
      cameraId,
      x,
      y,
      activeViewId: get().activeViewId,
      cameras: get().document.cameras,
    });
    if (!start) return;
    set(start);
  },

  updateCropDrag: (x, y) => {
    const meta = get().cropDragMeta;
    if (!meta) return;
    set(updateCropDragLive(meta, x, y));
  },

  commitCropDrag: () => {
    const s = get();
    const commit = resolveCropDragCommit(s.cropDragMeta, s.cropDragLive);
    set({ cropDragMeta: null, cropDragLive: null, cameraPoseDragLive: null });
    if (commit.kind === "clear-only") return;
    if (commit.kind === "translate-camera") {
      applyCommand(
        get,
        set,
        new TranslateCameraPlanCommand(commit.cameraId, commit.dx, commit.dy),
        "Cámara movida en planta",
      );
      return;
    }
    if (commit.kind === "set-camera-crop") {
      applyCommand(
        get,
        set,
        new SetCameraCropCommand(commit.cameraId, commit.crop),
        "Recorte redimensionado",
      );
      return;
    }
    set({
      views: get().views.map((v) =>
        v.id === commit.viewId ? { ...v, crop: commit.crop } : v,
      ),
      status: "Recorte de vista redimensionado",
    });
  },

  cancelCropDrag: () => {
    set({
      cropDragMeta: null,
      cropDragLive: null,
      cameraPoseDragLive: null,
      status: "Recorte cancelado",
    });
  },

  setSelectedDoorLeafState: (leafState) => {
    const id = get().selectedDoorId;
    if (!id) return;
    const label =
      leafState === "open" ? "abierta 90°" : leafState === "ajar" ? "entreabierta 45°" : "cerrada";
    applyCommand(get, set, new SetDoorLeafStateCommand(id, leafState), `Hoja ${label}`);
  },

  setSelectedDoorSwing: (swing) => {
    const id = get().selectedDoorId;
    if (!id) return;
    applyCommand(
      get,
      set,
      new SetDoorSwingCommand(id, swing),
      swing === "positive" ? "Sentido → +" : "Sentido → −",
    );
  },

  flipSelectedDoorSwing: () => {
    const id = get().selectedDoorId;
    if (!id) return;
    const d = get().document.doors.find((x) => x.id === id);
    if (!d) return;
    const next: DoorSwing = (d.swing ?? "positive") === "positive" ? "negative" : "positive";
    applyCommand(
      get,
      set,
      new SetDoorSwingCommand(id, next),
      next === "positive" ? "Sentido → +" : "Sentido → −",
    );
  },

  flipSelectedDoorHinge: () => {
    const id = get().selectedDoorId;
    if (!id) return;
    const d = get().document.doors.find((x) => x.id === id);
    if (!d) return;
    const next = d.hinge === "start" ? "end" : "start";
    applyCommand(
      get,
      set,
      new SetDoorHingeCommand(id, next),
      next === "start" ? "Bisagra → inicio" : "Bisagra → fin",
    );
  },

  setSelectedDoorHinge: (hinge) => {
    const id = get().selectedDoorId;
    if (!id) return;
    applyCommand(
      get,
      set,
      new SetDoorHingeCommand(id, hinge),
      hinge === "start" ? "Bisagra → inicio" : "Bisagra → fin",
    );
  },

  setSelectedDoorFamily: (familyId) => {
    const id = get().selectedDoorId;
    if (!id) return;
    const door = get().document.doors.find((d) => d.id === id);
    const fam = doorFamilyById(familyId);
    if (!door || !fam) return;
    const wall = get().document.walls.find((w) => w.id === door.wallId);
    const height = wall
      ? Math.min(fam.height, Math.max(0.5, wall.height - 0.05))
      : fam.height;
    const len = wall
      ? Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y)
      : Infinity;
    const half = fam.width / 2;
    if (wall && (door.centerOffset < half + 0.05 || door.centerOffset > len - half - 0.05)) {
      set({ status: "La familia no cabe en esta posición del muro" });
      return;
    }
    const overlap = get().document.doors.some((d) => {
      if (d.id === id || d.wallId !== door.wallId) return false;
      return Math.abs(d.centerOffset - door.centerOffset) < (d.width + fam.width) / 2 + 0.02;
    });
    if (overlap) {
      set({ status: "La familia solapa con otra puerta" });
      return;
    }
    applyCommand(
      get,
      set,
      new SetDoorFamilyCommand(id, familyId, fam.width, height),
      `Familia puerta → ${fam.label}`,
    );
  },

  setSelectedWindowLeafState: (leafState) => {
    const id = get().selectedWindowId;
    if (!id) return;
    const label =
      leafState === "open" ? "abierta 90°" : leafState === "ajar" ? "entreabierta 45°" : "cerrada";
    applyCommand(get, set, new SetWindowLeafStateCommand(id, leafState), `Hoja ${label}`);
  },

  setSelectedWindowSwing: (swing) => {
    const id = get().selectedWindowId;
    if (!id) return;
    applyCommand(
      get,
      set,
      new SetWindowSwingCommand(id, swing),
      swing === "positive" ? "Sentido → +" : "Sentido → −",
    );
  },

  flipSelectedWindowSwing: () => {
    const id = get().selectedWindowId;
    if (!id) return;
    const w = get().document.windows.find((x) => x.id === id);
    if (!w) return;
    const next: DoorSwing = (w.swing ?? "positive") === "positive" ? "negative" : "positive";
    applyCommand(
      get,
      set,
      new SetWindowSwingCommand(id, next),
      next === "positive" ? "Sentido → +" : "Sentido → −",
    );
  },

  flipSelectedWindowHinge: () => {
    const id = get().selectedWindowId;
    if (!id) return;
    const w = get().document.windows.find((x) => x.id === id);
    if (!w) return;
    const next = w.hinge === "start" ? "end" : "start";
    applyCommand(
      get,
      set,
      new SetWindowHingeCommand(id, next),
      next === "start" ? "Bisagra → inicio" : "Bisagra → fin",
    );
  },

  setSelectedWindowHinge: (hinge) => {
    const id = get().selectedWindowId;
    if (!id) return;
    applyCommand(
      get,
      set,
      new SetWindowHingeCommand(id, hinge),
      hinge === "start" ? "Bisagra → inicio" : "Bisagra → fin",
    );
  },

  setSelectedWindowFamily: (familyId) => {
    const id = get().selectedWindowId;
    if (!id) return;
    const win = get().document.windows.find((w) => w.id === id);
    const fam = windowFamilyById(familyId);
    if (!win || !fam) return;
    const wall = get().document.walls.find((w) => w.id === win.wallId);
    if (wall && fam.sill + fam.height > wall.height - 0.05) {
      set({ status: "La familia no cabe en la altura del muro" });
      return;
    }
    const len = wall
      ? Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y)
      : Infinity;
    const half = fam.width / 2;
    if (wall && (win.centerOffset < half + 0.05 || win.centerOffset > len - half - 0.05)) {
      set({ status: "La familia no cabe en esta posición del muro" });
      return;
    }
    const overlapsDoor = get().document.doors.some((d) => {
      if (d.wallId !== win.wallId) return false;
      return Math.abs(d.centerOffset - win.centerOffset) < (d.width + fam.width) / 2 + 0.02;
    });
    const overlapsWindow = get().document.windows.some((w) => {
      if (w.id === id || w.wallId !== win.wallId) return false;
      return Math.abs(w.centerOffset - win.centerOffset) < (w.width + fam.width) / 2 + 0.02;
    });
    if (overlapsDoor || overlapsWindow) {
      set({ status: "La familia solapa con otro hueco" });
      return;
    }
    applyCommand(
      get,
      set,
      new SetWindowFamilyCommand(id, familyId, fam.width, fam.height, fam.sill),
      `Familia ventana → ${fam.label}`,
    );
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
      selectedCameraId: view.cameraId ?? get().selectedCameraId,
      status:
        view.kind === "plan"
          ? `Vista ortogonal: ${view.name}`
          : view.kind === "camera"
            ? `Vista cámara: ${view.name}`
            : `Vista 3D: ${view.name}`,
    });
  },

  ensureViewOpen: (id) => get().setActiveView(id),

  addView: (kind) => {
    if (kind === "camera") {
      get().setTool("camera");
      // Prefer plan for placement
      const plan = get().views.find((v) => v.kind === "plan");
      if (plan) get().setActiveView(plan.id);
      return;
    }
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
}));
