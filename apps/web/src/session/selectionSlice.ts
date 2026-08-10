import {
  DeleteCameraCommand,
  DeleteDoorCommand,
  DeleteWallCommand,
  DeleteWindowCommand,
  SetCameraCropCommand,
  SetCameraEyeHeightCommand,
  SetCameraFovCommand,
  SetCameraNameCommand,
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
} from "@axonbim/commands";
import {
  OPENING_VERTICAL_MARGIN,
  asOpeningSpec,
  findDoorFamily,
  findWallFamily,
  findWindowFamily,
  openingsOnWall,
  validateHostedOpening,
  wallMaxHeightOf,
  type Door,
  type DoorLeafState,
  type DoorSwing,
  type ViewCrop,
  type Window,
} from "@axonbim/model";
import { rejectionStatus } from "./documentMutation.js";
import { applyCommand } from "./sliceContracts.js";
import type { SessionSliceCreator } from "./sliceTypes.js";

export const createSelectionSlice: SessionSliceCreator<{
  selectedWallId: string | null;
  selectedDoorId: string | null;
  selectedWindowId: string | null;
  selectedCameraId: string | null;
  selectedCropFrameCameraId: string | null;
  setSelectedWallId: (id: string | null) => void;
  setSelectedDoorId: (id: string | null) => void;
  setSelectedWindowId: (id: string | null) => void;
  setSelectedCameraId: (id: string | null) => void;
  setSelectedCropFrameCameraId: (id: string | null) => void;
  deleteSelectedWall: () => void;
  deleteSelectedDoor: () => void;
  deleteSelectedWindow: () => void;
  deleteSelectedCamera: () => void;
  setSelectedCameraName: (name: string) => void;
  setSelectedCameraFov: (fov: number) => void;
  setSelectedCameraEyeHeight: (z: number) => void;
  setSelectedCameraCrop: (crop: ViewCrop) => void;
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
}> = (set, get) => ({
  selectedWallId: null,
  selectedDoorId: null,
  selectedWindowId: null,
  selectedCameraId: null,
  selectedCropFrameCameraId: null,

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
    set({ selectedCameraId: null, selectedCropFrameCameraId: null });
  },

  setSelectedCameraName: (name) => {
    const id = get().selectedCameraId;
    if (!id || !name.trim()) return;
    applyCommand(get, set, new SetCameraNameCommand(id, name.trim()), `Nombre → ${name.trim()}`);
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
    const fam = findDoorFamily(get().document.doorFamilies, familyId);
    if (!door || !fam) return;
    const wall = get().document.walls.find((w) => w.id === door.wallId);
    if (!wall) return;
    // Tool may trim height; command re-validates fit + overlap (doors and windows).
    const height = Math.min(
      fam.height,
      Math.max(0.5, wallMaxHeightOf(wall) - OPENING_VERTICAL_MARGIN),
    );
    const candidate: Door = { ...door, familyId, width: fam.width, height };
    const fit = validateHostedOpening(
      asOpeningSpec(candidate),
      wall,
      openingsOnWall(door.wallId, get().document.doors, get().document.windows, id),
    );
    if (fit) {
      set({ status: rejectionStatus(fit.code, fit.message) });
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
    const fam = findWindowFamily(get().document.windowFamilies, familyId);
    if (!win || !fam) return;
    const wall = get().document.walls.find((w) => w.id === win.wallId);
    if (!wall) return;
    const candidate: Window = {
      ...win,
      familyId,
      width: fam.width,
      height: fam.height,
      sill: fam.sill,
    };
    const fit = validateHostedOpening(
      asOpeningSpec(candidate),
      wall,
      openingsOnWall(win.wallId, get().document.doors, get().document.windows, id),
    );
    if (fit) {
      set({ status: rejectionStatus(fit.code, fit.message) });
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
    const fam = findWallFamily(get().document.families, familyId);
    if (!id || !fam) return;
    applyCommand(
      get,
      set,
      new SetWallFamilyCommand(id, familyId, fam.thickness),
      `Familia → ${fam.label}`,
    );
  },
});
