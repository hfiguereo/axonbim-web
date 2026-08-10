/**
 * WP-v2 — tangible workplane session state (not AxonDocument SoT).
 */
import {
  getActiveStorey,
  wallFaceTowardPoint,
  workplaneFromLineTrace,
  workplaneFromStorey,
  workplaneFromWallFace,
  workplaneStatusLabel,
  type Workplane,
} from "@axonbim/model";
import type { SessionSliceCreator } from "./sliceTypes.js";

export type WorkplaneLock = "auto-level" | "manual";

export const createWorkplaneSlice: SessionSliceCreator<{
  activeWorkplane: Workplane;
  workplaneLock: WorkplaneLock;
  /** Pending first click for "plano por línea". */
  workplaneLinePending: { x: number; y: number; z: number } | null;
  resetWorkplaneToLevel: () => void;
  setWorkplaneFromSurface: (
    wallId: string,
    face?: "front" | "back",
    hint?: { x: number; y: number; z: number },
  ) => void;
  setWorkplaneFromLine: (
    p1: { x: number; y: number; z: number },
    p2: { x: number; y: number; z: number },
  ) => void;
  /** Select-plane tool: wall → surface; empty → level. */
  workplaneSelectClick: (
    wallId: string | null,
    hint?: { x: number; y: number; z: number },
  ) => void;
  /** Line-plane tool: accumulate 2 clicks on current pick plane. */
  workplaneLineClick: (p: { x: number; y: number; z: number }) => void;
}> = (set, get) => {
  const levelPlane = (): Workplane => {
    const s = get();
    const storey = getActiveStorey(s.document, s.activeStoreyId);
    return workplaneFromStorey(storey);
  };

  return {
    activeWorkplane: workplaneFromStorey({
      id: "storey.default",
      name: "Nivel 1",
      elevation: 0,
    }),
    workplaneLock: "auto-level",
    workplaneLinePending: null,

    resetWorkplaneToLevel: () => {
      if (get().sketchTarget) {
        set({
          status:
            "Sketch activo — cancela o termina antes de cambiar el Workplane",
        });
        return;
      }
      const wp = levelPlane();
      set({
        activeWorkplane: wp,
        workplaneLock: "auto-level",
        workplaneLinePending: null,
        status: `Workplane: ${workplaneStatusLabel(wp)}`,
      });
    },

    setWorkplaneFromSurface: (wallId, face, hint) => {
      if (get().sketchTarget) {
        set({
          status:
            "Sketch activo — cancela o termina antes de cambiar el Workplane",
        });
        return;
      }
      const s = get();
      const wall = s.document.walls.find((w) => w.id === wallId);
      if (!wall) {
        set({ status: "Ese muro ya no está en el documento" });
        return;
      }
      const side =
        face ??
        (hint ? wallFaceTowardPoint(wall, hint) : "front");
      const wp = workplaneFromWallFace(wall, side);
      if (!wp) {
        set({ status: "No se pudo crear el plano de la cara" });
        return;
      }
      set({
        activeWorkplane: wp,
        activeStoreyId: wall.storeyId,
        workplaneLock: "manual",
        workplaneLinePending: null,
        selectedWallId: wallId,
        status: `Workplane: ${workplaneStatusLabel(wp)}`,
      });
    },

    setWorkplaneFromLine: (p1, p2) => {
      if (get().sketchTarget) {
        set({
          status:
            "Sketch activo — cancela o termina antes de cambiar el Workplane",
        });
        return;
      }
      const s = get();
      const storey = getActiveStorey(s.document, s.activeStoreyId);
      const wp = workplaneFromLineTrace(p1, p2, storey.id, storey.elevation);
      if (!wp) {
        set({ status: "Línea demasiado corta para un plano de trabajo" });
        return;
      }
      set({
        activeWorkplane: wp,
        workplaneLock: "manual",
        workplaneLinePending: null,
        status: `Workplane: ${workplaneStatusLabel(wp)}`,
      });
    },

    workplaneSelectClick: (wallId, hint) => {
      if (wallId) {
        get().setWorkplaneFromSurface(wallId, undefined, hint);
        return;
      }
      get().resetWorkplaneToLevel();
    },

    workplaneLineClick: (p) => {
      const s = get();
      if (!s.workplaneLinePending) {
        set({
          workplaneLinePending: p,
          status: "Plano por línea — clic 2: fin de la traza (vertical en XYZ)",
        });
        return;
      }
      get().setWorkplaneFromLine(s.workplaneLinePending, p);
    },
  };
};
