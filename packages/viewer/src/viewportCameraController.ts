import type { Wall } from "@axonbim/model";
import { wallMaxHeightOf } from "@axonbim/model";
import { Spherical, Vector3 } from "three";
import {
  resolveCameraPresetPose,
  type CameraPreset,
} from "./cameraPresetPose.js";
import {
  computeWallsFitBounds,
  resolvePerspectiveFitFraming,
  resolvePlanFitFraming,
} from "./fitWallsFraming.js";
import type { ViewportContext, ViewProjection } from "./viewportContext.js";

const ORBIT_SENS = 0.009;

export type ViewportCameraController = {
  applyPerspPose: () => void;
  applyPlanPose: () => void;
  updateOrthoFrustum: (halfH?: number) => void;
  updateOrtho3dFrustum: (halfH?: number) => void;
  orbit3dCamera: (dx: number, dy: number) => void;
  fitEmpty: () => void;
  fitWalls: (walls: Wall[]) => void;
  setProjection: (mode: ViewProjection) => void;
  setOrbitPivot: (point: { x: number; y: number; z: number }) => void;
  getOrbitPivot: () => { x: number; y: number; z: number };
  setCameraPreset: (preset: CameraPreset) => void;
  orbitByDelta: (dx: number, dy: number) => void;
  applyModelCamera: (cam: {
    eye: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  }) => void;
  /** When false, wheel zoom and orbit drag are ignored (camera view lock). */
  setNavigationEnabled: (enabled: boolean) => void;
  bindNavigation: () => () => void;
};

export function createViewportCameraController(
  ctx: ViewportContext,
  syncSceneForMode: () => void,
): ViewportCameraController {
  const { canvas, persp, ortho, ortho3d, orbitTarget } = ctx;
  const spherical = new Spherical();
  const offsetVec = new Vector3();

  const applyPerspPose = () => {
    ctx.useOrtho3d = false;
    persp.position.set(8, -10, 7);
    orbitTarget.set(0, 0, 0);
    persp.up.set(0, 0, 1);
    persp.lookAt(orbitTarget);
  };

  const applyPlanPose = () => {
    ortho.position.set(0, 0, 40);
    ortho.up.set(0, 1, 0);
    ortho.lookAt(0, 0, 0);
  };

  const updateOrthoFrustum = (halfH = ctx.orthoHalfH) => {
    ctx.orthoHalfH = halfH;
    const aspect = ctx.width / Math.max(ctx.height, 1);
    const halfW = halfH * aspect;
    ortho.left = -halfW;
    ortho.right = halfW;
    ortho.top = halfH;
    ortho.bottom = -halfH;
    ortho.updateProjectionMatrix();
  };

  const updateOrtho3dFrustum = (halfH = ctx.ortho3dHalfH) => {
    ctx.ortho3dHalfH = halfH;
    const aspect = ctx.width / Math.max(ctx.height, 1);
    const halfW = halfH * aspect;
    ortho3d.left = -halfW;
    ortho3d.right = halfW;
    ortho3d.top = halfH;
    ortho3d.bottom = -halfH;
    ortho3d.updateProjectionMatrix();
  };

  const orbit3dCamera = (dx: number, dy: number) => {
    const cam = ctx.useOrtho3d ? ortho3d : persp;
    offsetVec.copy(cam.position).sub(orbitTarget);
    spherical.setFromVector3(offsetVec);
    spherical.theta -= dx * ORBIT_SENS;
    spherical.phi -= dy * ORBIT_SENS;
    spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, spherical.phi));
    offsetVec.setFromSpherical(spherical);
    cam.position.copy(orbitTarget).add(offsetVec);
    cam.up.set(0, 0, 1);
    // Keep sensible up for near-top views
    if (Math.abs(spherical.phi) < 0.2 || Math.abs(spherical.phi - Math.PI) < 0.2) {
      cam.up.set(0, 1, 0);
    }
    cam.lookAt(orbitTarget);
  };

  applyPerspPose();
  applyPlanPose();

  const fitEmpty = () => {
    if (ctx.mode === "plan") applyPlanPose();
    else applyPerspPose();
    updateOrthoFrustum(10);
    updateOrtho3dFrustum(10);
  };

  const fitWalls = (walls: Wall[]) => {
    const bounds = computeWallsFitBounds(
      walls.map((w) => ({
        p1: w.p1,
        p2: w.p2,
        height: wallMaxHeightOf(w),
      })),
    );
    if (!bounds) {
      fitEmpty();
      return;
    }
    if (ctx.mode === "plan") {
      const framing = resolvePlanFitFraming(bounds);
      ortho.position.set(
        framing.position.x,
        framing.position.y,
        framing.position.z,
      );
      ortho.lookAt(framing.lookAt.x, framing.lookAt.y, framing.lookAt.z);
      updateOrthoFrustum(framing.orthoHalfH);
    } else {
      const framing = resolvePerspectiveFitFraming(bounds);
      orbitTarget.set(framing.orbit.x, framing.orbit.y, framing.orbit.z);
      ctx.useOrtho3d = false;
      persp.position.set(framing.eye.x, framing.eye.y, framing.eye.z);
      persp.up.set(framing.up.x, framing.up.y, framing.up.z);
      persp.lookAt(orbitTarget);
      updateOrtho3dFrustum(framing.orthoHalfH);
    }
  };

  const setProjection = (next: ViewProjection) => {
    ctx.mode = next;
    if (ctx.mode === "plan") {
      applyPlanPose();
    } else if (!ctx.useOrtho3d) {
      // Keep current 3D pose; ensure persp looks at pivot
      persp.lookAt(orbitTarget);
    }
    updateOrthoFrustum(ctx.orthoHalfH);
    updateOrtho3dFrustum(ctx.ortho3dHalfH);
    syncSceneForMode();
  };

  const setOrbitPivot = (point: { x: number; y: number; z: number }) => {
    const cam = ctx.useOrtho3d ? ortho3d : persp;
    offsetVec.copy(cam.position).sub(orbitTarget);
    orbitTarget.set(point.x, point.y, point.z);
    cam.position.copy(orbitTarget).add(offsetVec);
    cam.lookAt(orbitTarget);
  };

  const getOrbitPivot = () => ({
    x: orbitTarget.x,
    y: orbitTarget.y,
    z: orbitTarget.z,
  });

  const setCameraPreset = (preset: CameraPreset) => {
    if (ctx.mode === "plan") return;
    const dist = ctx.useOrtho3d
      ? ortho3d.position.distanceTo(orbitTarget)
      : persp.position.distanceTo(orbitTarget);
    const pose = resolveCameraPresetPose(preset, orbitTarget, dist);
    if (!pose.useOrtho3d) {
      ctx.useOrtho3d = false;
      persp.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
      persp.up.set(pose.up.x, pose.up.y, pose.up.z);
      persp.lookAt(orbitTarget);
      persp.updateProjectionMatrix();
    } else {
      ctx.useOrtho3d = true;
      ortho3d.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
      ortho3d.up.set(pose.up.x, pose.up.y, pose.up.z);
      ortho3d.lookAt(orbitTarget);
      updateOrtho3dFrustum(pose.orthoHalfH);
    }
  };

  const orbitByDelta = (dx: number, dy: number) => {
    if (ctx.mode === "plan" || !navigationEnabled) return;
    orbit3dCamera(dx, dy);
  };

  const applyModelCamera = (cam: {
    eye: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  }) => {
    if (ctx.mode === "plan") return;
    ctx.useOrtho3d = false;
    orbitTarget.set(cam.target.x, cam.target.y, cam.target.z);
    persp.position.set(cam.eye.x, cam.eye.y, cam.eye.z);
    persp.up.set(0, 0, 1);
    persp.fov = Math.min(120, Math.max(10, cam.fov));
    persp.lookAt(orbitTarget);
    persp.updateProjectionMatrix();
  };

  let navigationEnabled = true;
  const setNavigationEnabled = (enabled: boolean) => {
    navigationEnabled = enabled;
  };

  const bindNavigation = () => {
    const onWheel = (e: WheelEvent) => {
      if (!navigationEnabled) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const direction = Math.sign(e.deltaY);
      const factor = direction > 0 ? 1.12 : 1 / 1.12;
      if (ctx.mode === "plan") {
        updateOrthoFrustum(Math.min(80, Math.max(1.5, ctx.orthoHalfH * factor)));
      } else if (ctx.useOrtho3d) {
        updateOrtho3dFrustum(Math.min(80, Math.max(1.5, ctx.ortho3dHalfH * factor)));
      } else {
        const offset = persp.position.clone().sub(orbitTarget);
        const dist = offset.length();
        const nextDist = Math.min(120, Math.max(2, dist * factor));
        offset.setLength(nextDist);
        persp.position.copy(orbitTarget).add(offset);
        persp.lookAt(orbitTarget);
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });

    let navActive = false;
    let navButton = -1;
    let lastX = 0;
    let lastY = 0;

    const onPointerDown = (e: PointerEvent) => {
      if (!navigationEnabled) return;
      if (e.button !== 1 && e.button !== 2) return;
      e.preventDefault();
      navActive = true;
      navButton = e.button;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!navActive || !navigationEnabled) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (ctx.mode === "plan") {
        const scale = ctx.planWorldPerPixel();
        ortho.position.x -= dx * scale;
        ortho.position.y += dy * scale;
        ortho.lookAt(ortho.position.x, ortho.position.y, 0);
      } else {
        orbit3dCamera(dx, dy);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!navActive) return;
      if (e.button !== navButton && e.type !== "pointercancel") return;
      navActive = false;
      navButton = -1;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };
  };

  return {
    applyPerspPose,
    applyPlanPose,
    updateOrthoFrustum,
    updateOrtho3dFrustum,
    orbit3dCamera,
    fitEmpty,
    fitWalls,
    setProjection,
    setOrbitPivot,
    getOrbitPivot,
    setCameraPreset,
    orbitByDelta,
    applyModelCamera,
    setNavigationEnabled,
    bindNavigation,
  };
}

export type { CameraPreset };
