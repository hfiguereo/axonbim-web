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
import { doorFamilyById, familyById, windowFamilyById } from "@axonbim/families";
import {
  defaultCameraCrop,
  type Camera,
  type Door,
  type Wall,
  type Window,
} from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";
import type { DrawMode, ToolId } from "@axonbim/tools";
import { collectEndpoints, isCameraTool, isSketchTool, snapWallPoint } from "@axonbim/tools";
import { projectPointOnWall } from "@axonbim/geometry";
import { DEFAULT_CAMERA_EYE_Z, DEFAULT_CAMERA_FOV, type ProjectView } from "./sessionTypes.js";
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
  snapEnabled: boolean;
  setTool: (tool: ToolId) => void;
  setDrawMode: (mode: DrawMode) => void;
  setWallChain: (chained: boolean) => void;
  setSnapEnabled: (enabled: boolean) => void;
  splitWallChain: () => void;
  releaseWallChain: () => void;
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
});
