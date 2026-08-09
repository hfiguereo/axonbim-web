import {
  CreateCameraCommand,
  CreateDoorCommand,
  CreateWallCommand,
  CreateWindowCommand,
  createCameraId,
  createDoorId,
  createWallId,
  createWindowId,
} from "@axonbim/commands";
import {
  OPENING_VERTICAL_MARGIN,
  asOpeningSpec,
  defaultCameraCrop,
  findDoorFamily,
  findWallFamily,
  findWindowFamily,
  pointOnWorkplaneXY,
  resolveSpatialReference,
  openingsOnWall,
  validateHostedOpening,
  type Camera,
  type Door,
  type Wall,
  type Window,
} from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { DrawMode, ToolId } from "@axonbim/tools";
import {
  clearSnapSession,
  collectEndpoints,
  emptySnapSession,
  isCameraTool,
  isSketchTool,
  restartChainAt,
  snapWallPoint,
  type SnapSession,
} from "@axonbim/tools";
import { projectPointOnWall } from "@axonbim/geometry";
import { cameraViewId } from "./cameraViews.js";
import { rejectionStatus } from "./documentMutation.js";
import { DEFAULT_CAMERA_EYE_Z, DEFAULT_CAMERA_FOV } from "./sessionTypes.js";
import { applyCommand } from "./sliceContracts.js";
import type { SessionSliceCreator } from "./sliceTypes.js";

export const createSketchToolSlice: SessionSliceCreator<{
  activeTool: ToolId;
  drawMode: DrawMode;
  wallChain: boolean;
  activeFamilyId: string;
  wallHeight: number;
  activeDoorFamilyId: string;
  activeWindowFamilyId: string;
  wallPending: { x: number; y: number; z: number } | null;
  wallChainOrigin: { x: number; y: number; z: number } | null;
  wallHover: { x: number; y: number; z: number } | null;
  lastSnapKind: import("@axonbim/tools").SnapKind;
  /** LR1 — ortho axis lock for current segment; never in AxonDocument. */
  snapSession: SnapSession;
  snapEnabled: boolean;
  setTool: (tool: ToolId) => void;
  setDrawMode: (mode: DrawMode) => void;
  setWallChain: (chained: boolean) => void;
  setSnapEnabled: (enabled: boolean) => void;
  splitWallChain: () => void;
  releaseWallChain: () => void;
  /** LR1-B — new chain at point; no document/history mutation. */
  restartChainAt: (point: { x: number; y: number; z: number }) => void;
  setActiveFamilyId: (id: string) => void;
  setWallHeight: (height: number) => void;
  setActiveDoorFamilyId: (id: string) => void;
  setActiveWindowFamilyId: (id: string) => void;
  placeDoorOnWall: (wallId: string, world: { x: number; y: number }) => void;
  placeWindowOnWall: (wallId: string, world: { x: number; y: number }) => void;
  setWallHover: (p: { x: number; y: number; z: number } | null, forceOrtho?: boolean) => void;
  wallClick: (p: { x: number; y: number; z: number }, forceOrtho?: boolean) => void;
  cameraClick: (p: { x: number; y: number; z: number }) => void;
  cancelWallDraw: () => void;
}> = (set, get) => ({
  activeTool: "none",
  drawMode: "line",
  wallChain: true,
  activeFamilyId: "family.block-150",
  wallHeight: 2.7,
  activeDoorFamilyId: "family.door-90",
  activeWindowFamilyId: "family.window-90x120",
  wallPending: null,
  wallChainOrigin: null,
  wallHover: null,
  lastSnapKind: "none",
  snapSession: emptySnapSession(),
  snapEnabled: true,

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
        snapSession: clearSnapSession(),
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
        snapSession: clearSnapSession(),
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
        snapSession: clearSnapSession(),
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
        snapSession: clearSnapSession(),
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
        snapSession: clearSnapSession(),
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
      snapSession: clearSnapSession(),
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
      snapSession: clearSnapSession(),
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
      snapSession: clearSnapSession(),
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
      snapSession: clearSnapSession(),
      status: "Cadena soltada — coloca segmentos sueltos",
    });
  },

  restartChainAt: (point) => {
    const s = get();
    if (s.activeTool !== "wall") return;
    const next = restartChainAt(point);
    set({
      ...next,
      status: "Cadena reiniciada — P1 fijado · clic P2 (sin historial)",
    });
  },

  setActiveFamilyId: (activeFamilyId) => {
    const fam = findWallFamily(get().document.families, activeFamilyId);
    if (!fam) {
      set({ status: "Esa familia de muro no existe en el documento" });
      return;
    }
    set({ activeFamilyId, status: `Familia: ${fam.label}` });
  },

  setWallHeight: (wallHeight) => set({ wallHeight }),

  setActiveDoorFamilyId: (activeDoorFamilyId) => {
    const fam = findDoorFamily(get().document.doorFamilies, activeDoorFamilyId);
    if (!fam) {
      set({ status: "Esa familia de puerta no existe en el documento" });
      return;
    }
    set({ activeDoorFamilyId, status: `Familia puerta: ${fam.label}` });
  },

  setActiveWindowFamilyId: (activeWindowFamilyId) => {
    const fam = findWindowFamily(get().document.windowFamilies, activeWindowFamilyId);
    if (!fam) {
      set({ status: "Esa familia de ventana no existe en el documento" });
      return;
    }
    set({ activeWindowFamilyId, status: `Familia ventana: ${fam.label}` });
  },

  placeDoorOnWall: (wallId, world) => {
    const s = get();
    const wall = s.document.walls.find((w) => w.id === wallId);
    if (!wall) {
      set({ status: "Muro no encontrado" });
      return;
    }
    const fam = findDoorFamily(s.document.doorFamilies, s.activeDoorFamilyId);
    if (!fam) {
      set({ status: "Esa familia de puerta no existe en el documento" });
      return;
    }
    const { offset } = projectPointOnWall(wall, world);
    // Tool may trim height to the wall; the command still re-validates (ADR 0017).
    const door: Door = {
      id: createDoorId(),
      wallId,
      familyId: fam.id,
      centerOffset: offset,
      width: fam.width,
      height: Math.min(fam.height, wall.height - OPENING_VERTICAL_MARGIN),
      sill: 0,
      hinge: "start",
      swing: "positive",
      leafState: "open",
    };
    const fit = validateHostedOpening(
      asOpeningSpec(door),
      wall,
      openingsOnWall(wallId, s.document.doors, s.document.windows),
    );
    if (fit) {
      set({ status: rejectionStatus(fit.code, fit.message) });
      return;
    }
    applyCommand(get, set, new CreateDoorCommand(door), `Puerta ${fam.width.toFixed(2)} m`);
    set({ selectedDoorId: door.id, selectedWallId: null, selectedWindowId: null });
  },

  placeWindowOnWall: (wallId, world) => {
    const s = get();
    const wall = s.document.walls.find((w) => w.id === wallId);
    if (!wall) {
      set({ status: "Muro no encontrado" });
      return;
    }
    const fam = findWindowFamily(s.document.windowFamilies, s.activeWindowFamilyId);
    if (!fam) {
      set({ status: "Esa familia de ventana no existe en el documento" });
      return;
    }
    const { offset } = projectPointOnWall(wall, world);
    const win: Window = {
      id: createWindowId(),
      wallId,
      familyId: fam.id,
      centerOffset: offset,
      width: fam.width,
      height: fam.height,
      sill: fam.sill,
      hinge: "start",
      swing: "positive",
      leafState: "closed",
    };
    const fit = validateHostedOpening(
      asOpeningSpec(win),
      wall,
      openingsOnWall(wallId, s.document.doors, s.document.windows),
    );
    if (fit) {
      set({ status: rejectionStatus(fit.code, fit.message) });
      return;
    }
    applyCommand(get, set, new CreateWindowCommand(win), `Ventana ${fam.width.toFixed(2)} m`);
    set({ selectedWindowId: win.id, selectedWallId: null, selectedDoorId: null });
  },

  setWallHover: (raw, forceOrtho = false) => {
    if (!raw) {
      set({ wallHover: null, lastSnapKind: "none" });
      return;
    }
    const s = get();
    if (!s.snapEnabled) {
      set({ wallHover: raw, lastSnapKind: "none", snapSession: clearSnapSession() });
      return;
    }
    const snap = snapWallPoint({
      raw,
      pending: s.wallPending,
      chainOrigin: s.wallChainOrigin,
      endpoints: collectEndpoints(s.document.walls),
      forceOrtho,
      session: s.snapSession,
    });
    set({ wallHover: snap.point, lastSnapKind: snap.kind, snapSession: snap.session });
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
          session: s.snapSession,
        })
      : {
          point: raw,
          kind: "none" as const,
          closed: false,
          session: clearSnapSession(),
        };
    const p = snap.point;

    if (!s.wallPending) {
      set({
        wallPending: p,
        wallChainOrigin: s.wallChainOrigin ?? p,
        wallHover: p,
        lastSnapKind: snap.kind,
        snapSession: clearSnapSession(),
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

    const fam = findWallFamily(s.document.families, s.activeFamilyId);
    if (!fam) {
      set({ status: "Esa familia de muro no existe en el documento", lastSnapKind: snap.kind });
      return;
    }
    const spatial = resolveSpatialReference(s.document, s.activeStoreyId);
    const wp = spatial.workplane;
    const wall: Wall = {
      id: createWallId(),
      storeyId: spatial.storeyId,
      familyId: fam.id,
      p1: pointOnWorkplaneXY(wp, p1.x, p1.y),
      p2: pointOnWorkplaneXY(wp, p.x, p.y),
      height: s.wallHeight,
      thickness: fam.thickness,
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

    const onPlane = pointOnWorkplaneXY(wp, p.x, p.y);
    if (snap.closed || !s.wallChain) {
      set({
        wallPending: null,
        wallChainOrigin: null,
        wallHover: null,
        lastSnapKind: "none",
        snapSession: clearSnapSession(),
        status: snap.closed
          ? "Espacio cerrado — clic para nuevo trazo"
          : "Segmento colocado",
      });
    } else {
      set({
        wallPending: onPlane,
        wallHover: onPlane,
        lastSnapKind: snap.kind,
        snapSession: clearSnapSession(),
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
    // Tab is derived from document.cameras inside applyCommand (F9-E4).
    set({
      activeViewId: cameraViewId(id),
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
      snapSession: clearSnapSession(),
      status:
        tool === "camera"
          ? "Cámara cancelada — clic 1 para ojo"
          : "Trazado cancelado — clic para nuevo P1",
    });
  },
});
