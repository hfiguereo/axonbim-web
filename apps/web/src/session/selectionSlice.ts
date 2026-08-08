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
import { doorFamilyById, familyById, windowFamilyById } from "@axonbim/families";
import type { Door, DoorLeafState, DoorSwing, ViewCrop, Window } from "@axonbim/model";
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
});
