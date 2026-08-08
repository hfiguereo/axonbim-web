import {
  computeWallJoinDirs,
  doorAssemblyMeshes,
  doorPlanSymbol,
  openingsFromHosted,
  wallMeshWithOpenings,
  windowAssemblyMeshes,
  windowPlanSymbol,
  cameraPlanSymbol,
  cameraVisionConeLines,
  type MeshBuffer,
  type PlanFlipControl,
} from "@axonbim/geometry";
import type { Camera, Door, ViewCrop, Wall, Window } from "@axonbim/model";
import { viewCropCorners, viewCropPlanLines } from "@axonbim/model";
import {
  AmbientLight,
  AxesHelper,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  GridHelper,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  SphereGeometry,
  Spherical,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  resolveCameraPresetPose,
  type CameraPreset,
} from "./cameraPresetPose.js";
import {
  computeWallsFitBounds,
  resolvePerspectiveFitFraming,
  resolvePlanFitFraming,
} from "./fitWallsFraming.js";
import {
  CAMERA_PICK_RADIUS_PX,
  CROP_FRAME_PROXIMITY_PX,
  CROP_GRIP_PROXIMITY_PX,
  CROP_GRIP_RADIUS_PX,
  ENTITY_PROXIMITY_PX,
  FLIP_CONTROL_PROXIMITY_PX,
  FLIP_CONTROL_RADIUS_PX,
  MIN_CAMERA_PICK_RADIUS,
  MIN_CROP_GRIP_RADIUS,
  orthoWorldPerPixel,
  perspectiveWorldPerPixel,
  pickLineThreshold,
  screenScaledRadius,
} from "./pickTolerance.js";
import {
  applyViewCropClipping,
  clearGroupMeshes,
  createClipPlanePool,
  createPlanCropMaskMaterial,
} from "./viewCropClip.js";

export type { CameraPreset } from "./cameraPresetPose.js";

export type ViewProjection = "perspective" | "plan";

export type FlipPick = {
  entityType: "door" | "window";
  entityId: string;
  kind: PlanFlipControl["kind"];
};

export type CropGripPick = {
  corner: 0 | 1 | 2 | 3;
  /** Camera entity id, or null for session ProjectView.crop */
  cameraId: string | null;
};

export type ViewportHandle = {
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  fitEmpty: () => void;
  fitWalls: (walls: Wall[]) => void;
  setProjection: (mode: ViewProjection) => void;
  /**
   * Named view for the 3D tab. Non-iso → orthographic 3D; iso → perspective.
   * Orbit remains enabled around the current pivot.
   */
  setCameraPreset: (preset: CameraPreset) => void;
  /** Orbit the 3D camera by screen delta (px). No-op in plan. */
  orbitByDelta: (dx: number, dy: number) => void;
  /** Pose the 3D perspective camera from a model Camera entity. */
  applyModelCamera: (cam: {
    eye: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    fov: number;
  }) => void;
  /** World-space orbit / look-at pivot for the 3D cameras. */
  setOrbitPivot: (point: { x: number; y: number; z: number }) => void;
  getOrbitPivot: () => { x: number; y: number; z: number };
  syncWalls: (
    walls: Wall[],
    doors: Door[],
    windows: Window[],
    cameras: Camera[],
    selectedWallId: string | null,
    selectedDoorId: string | null,
    selectedWindowId: string | null,
    selectedCameraId: string | null,
    /** Session crop for plan/perspective (not camera entity). */
    sessionCrop?: ViewCrop | null,
    /** Camera whose crop frame is selected (grips + move) in plan. */
    selectedCropFrameCameraId?: string | null,
  ) => void;
  /** Apply AABB clipping in 3D (no-op / disabled in plan). */
  setClippingCrop: (crop: ViewCrop | null) => void;
  setPreviewSegment: (
    p1: { x: number; y: number; z: number } | null,
    p2: { x: number; y: number; z: number } | null,
  ) => void;
  /** Snap marker + optional ortho guides while drawing. */
  setSnapCue: (
    point: { x: number; y: number; z: number } | null,
    kind: "none" | "endpoint" | "ortho" | "close",
    pending?: { x: number; y: number; z: number } | null,
  ) => void;
  /** NDC from canvas client coords → world point on storey plane z=elevation */
  pickGround: (
    clientX: number,
    clientY: number,
    elevation?: number,
  ) => { x: number; y: number; z: number } | null;
  pickWallId: (clientX: number, clientY: number) => string | null;
  pickDoorId: (clientX: number, clientY: number) => string | null;
  pickWindowId: (clientX: number, clientY: number) => string | null;
  pickCameraId: (clientX: number, clientY: number) => string | null;
  /** Plan orientation grips (swing / hinge) — reusable for hosted elements. */
  pickFlipControl: (clientX: number, clientY: number) => FlipPick | null;
  /** Crop region corner grips. */
  pickCropGrip: (clientX: number, clientY: number) => CropGripPick | null;
  /** Pick camera crop frame body (not session crop). */
  pickCropFrame: (clientX: number, clientY: number) => { cameraId: string } | null;
};

export type CreateViewportOptions = {
  canvas: HTMLCanvasElement;
  background?: string;
  projection?: ViewProjection;
};

function meshFromBuffer(buffer: MeshBuffer): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(buffer.positions, 3));
  g.setAttribute("normal", new BufferAttribute(buffer.normals, 3));
  g.setIndex(new BufferAttribute(buffer.indices, 1));
  g.computeBoundingSphere();
  return g;
}

/** Three.js representation adapter — perspective or orthographic plan. */
export function createViewport(options: CreateViewportOptions): ViewportHandle {
  const { canvas, background = "#1c2228", projection: initial = "perspective" } = options;

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.localClippingEnabled = true;

  const scene = new Scene();
  scene.background = new Color(background);

  let width = 1;
  let height = 1;
  let mode: ViewProjection = initial;

  const persp = new PerspectiveCamera(45, 1, 0.05, 500);
  persp.up.set(0, 0, 1);

  /** Plan-tab orthographic camera (looking down −Z). */
  const ortho = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ortho.up.set(0, 1, 0);
  let orthoHalfH = 10;

  /** 3D-tab orthographic camera (Top/Front/… presets). */
  const ortho3d = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ortho3d.up.set(0, 0, 1);
  let ortho3dHalfH = 10;

  /** Shared orbit / look-at pivot for 3D cameras. */
  const orbitTarget = new Vector3(0, 0, 0);
  /** When true (and mode is 3D), render with ortho3d instead of persp. */
  let useOrtho3d = false;

  const ORBIT_SENS = 0.009;

  const applyPerspPose = () => {
    useOrtho3d = false;
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

  applyPerspPose();
  applyPlanPose();

  scene.add(new AmbientLight(0xffffff, 0.55));
  const sun = new DirectionalLight(0xfff2dd, 1.05);
  sun.position.set(6, -4, 12);
  scene.add(sun);

  const grid = new GridHelper(40, 40, 0x5a6a78, 0x2f3a44);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);
  const axes = new AxesHelper(1.5);
  scene.add(axes);

  const wallsGroup = new Group();
  scene.add(wallsGroup);

  const wallMat = new MeshLambertMaterial({
    color: 0xc4b49a,
    side: DoubleSide,
  });
  const wallSelectedMat = new MeshLambertMaterial({
    color: 0xd4a15a,
    side: DoubleSide,
    emissive: 0x3a2a10,
  });
  const doorMat = new MeshLambertMaterial({
    color: 0x8b5a2b,
    side: DoubleSide,
  });
  const doorSelectedMat = new MeshLambertMaterial({
    color: 0xc4783a,
    side: DoubleSide,
    emissive: 0x3a2010,
  });
  const doorFrameMat = new MeshLambertMaterial({
    color: 0x5c4030,
    side: DoubleSide,
  });
  const doorFrameSelectedMat = new MeshLambertMaterial({
    color: 0x7a5538,
    side: DoubleSide,
    emissive: 0x2a1808,
  });
  const doorHardwareMat = new MeshLambertMaterial({
    color: 0xb0b8c0,
    side: DoubleSide,
  });
  const doorHardwareSelectedMat = new MeshLambertMaterial({
    color: 0xd0d8e0,
    side: DoubleSide,
    emissive: 0x202428,
  });
  const doorsGroup = new Group();
  scene.add(doorsGroup);
  const windowsGroup = new Group();
  scene.add(windowsGroup);
  const camerasGroup = new Group();
  scene.add(camerasGroup);
  const cropGroup = new Group();
  scene.add(cropGroup);

  const cameraLineMat = new LineBasicMaterial({ color: 0xc8a45a });
  const cameraLineSelectedMat = new LineBasicMaterial({ color: 0xffd080 });
  const cameraConeSelectedMat = new LineBasicMaterial({ color: 0xe8c888 });
  const cropLineMat = new LineBasicMaterial({ color: 0x6ec6ff });
  const cropLineSelectedMat = new LineBasicMaterial({ color: 0xa8e0ff });
  const cropGripMat = new MeshLambertMaterial({
    color: 0x6ec6ff,
    emissive: 0x103040,
  });
  const cameraPickGeom = new SphereGeometry(1, 10, 8);
  const cameraPickMat = new MeshLambertMaterial({
    color: 0xc8a45a,
    transparent: true,
    opacity: 0.01,
    depthWrite: false,
  });
  const cameraPickSelectedMat = new MeshLambertMaterial({
    color: 0xffd080,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });

  const windowFrameMat = new MeshLambertMaterial({
    color: 0x6a7a88,
    side: DoubleSide,
  });
  const windowFrameSelectedMat = new MeshLambertMaterial({
    color: 0x8aa0b4,
    side: DoubleSide,
    emissive: 0x1a2838,
  });
  const windowSashMat = new MeshLambertMaterial({
    color: 0xe8eef4,
    side: DoubleSide,
  });
  const windowSashSelectedMat = new MeshLambertMaterial({
    color: 0xf5f8fc,
    side: DoubleSide,
    emissive: 0x203040,
  });
  const windowGlassMat = new MeshLambertMaterial({
    color: 0x7ec8e8,
    transparent: true,
    opacity: 0.35,
    side: DoubleSide,
  });
  const windowGlassSelectedMat = new MeshLambertMaterial({
    color: 0xa0d8f0,
    transparent: true,
    opacity: 0.45,
    side: DoubleSide,
    emissive: 0x102030,
  });

  const planDoorsGroup = new Group();
  scene.add(planDoorsGroup);
  const planDoorLineMat = new LineBasicMaterial({ color: 0x2a3340 });
  const planDoorLineSelectedMat = new LineBasicMaterial({ color: 0xd4a15a });
  const flipSwingMat = new MeshLambertMaterial({
    color: 0x3d8bfd,
    emissive: 0x1a3a6a,
  });
  const flipHingeMat = new MeshLambertMaterial({
    color: 0x7dd87d,
    emissive: 0x1a4a1a,
  });
  const flipSphereGeom = new SphereGeometry(1, 12, 10);
  const flipControlsGroup = new Group();
  scene.add(flipControlsGroup);

  const clipMats: Array<MeshLambertMaterial | LineBasicMaterial> = [
    wallMat,
    wallSelectedMat,
    doorMat,
    doorSelectedMat,
    doorFrameMat,
    doorFrameSelectedMat,
    doorHardwareMat,
    doorHardwareSelectedMat,
    windowFrameMat,
    windowFrameSelectedMat,
    windowSashMat,
    windowSashSelectedMat,
    windowGlassMat,
    windowGlassSelectedMat,
    planDoorLineMat,
    planDoorLineSelectedMat,
  ];
  const clipPlanePool = createClipPlanePool();
  let currentClipCrop: ViewCrop | null = null;

  /** Solid masks outside plan crop AABB (reliable hide in top view). */
  const cropMaskGroup = new Group();
  scene.add(cropMaskGroup);
  const bgColor =
    scene.background instanceof Color ? scene.background.getHex() : 0x1c2228;
  const cropMaskMat = createPlanCropMaskMaterial(bgColor);

  const applyClippingState = () => {
    applyViewCropClipping({
      crop: currentClipCrop,
      renderer,
      materials: clipMats,
      planePool: clipPlanePool,
      maskGroup: cropMaskGroup,
      maskMaterial: cropMaskMat,
      isPlan: mode === "plan",
    });
  };

  const previewGeom = new BufferGeometry();
  previewGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(6), 3),
  );
  const previewMat = new LineBasicMaterial({ color: 0xd4a15a });
  const previewLine = new LineSegments(previewGeom, previewMat);
  previewLine.visible = false;
  scene.add(previewLine);

  // Snap cross (two segments) + ortho guide (axis from pending → snap)
  const snapMarkerGeom = new BufferGeometry();
  snapMarkerGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(12), 3),
  );
  const snapMarkerMat = new LineBasicMaterial({ color: 0x5ec8ff });
  const snapMarker = new LineSegments(snapMarkerGeom, snapMarkerMat);
  snapMarker.visible = false;
  scene.add(snapMarker);

  const snapGuideGeom = new BufferGeometry();
  snapGuideGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(6), 3),
  );
  const snapGuideMat = new LineBasicMaterial({ color: 0x5ec8ff });
  const snapGuide = new LineSegments(snapGuideGeom, snapGuideMat);
  snapGuide.visible = false;
  scene.add(snapGuide);

  const snapColors: Record<"none" | "endpoint" | "ortho" | "close", number> = {
    none: 0xb0b8c0,
    endpoint: 0x5ec8ff,
    ortho: 0x7dd87d,
    close: 0xe8b84a,
  };

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const groundPlane = new Plane(new Vector3(0, 0, 1), 0);
  const hit = new Vector3();

  const activeCamera = () => {
    if (mode === "plan") return ortho;
    return useOrtho3d ? ortho3d : persp;
  };

  const updateOrthoFrustum = (halfH = orthoHalfH) => {
    orthoHalfH = halfH;
    const aspect = width / Math.max(height, 1);
    const halfW = halfH * aspect;
    ortho.left = -halfW;
    ortho.right = halfW;
    ortho.top = halfH;
    ortho.bottom = -halfH;
    ortho.updateProjectionMatrix();
  };

  const updateOrtho3dFrustum = (halfH = ortho3dHalfH) => {
    ortho3dHalfH = halfH;
    const aspect = width / Math.max(height, 1);
    const halfW = halfH * aspect;
    ortho3d.left = -halfW;
    ortho3d.right = halfW;
    ortho3d.top = halfH;
    ortho3d.bottom = -halfH;
    ortho3d.updateProjectionMatrix();
  };

  /** World units ≈ one screen pixel at the orbit pivot (for pick tolerance). */
  const worldPerPixelAtPivot = (): number => {
    const cam = activeCamera();
    if (cam instanceof OrthographicCamera) {
      return orthoWorldPerPixel(mode === "plan" ? orthoHalfH : ortho3dHalfH, height);
    }
    return perspectiveWorldPerPixel(
      cam.position.distanceTo(orbitTarget),
      (cam as PerspectiveCamera).fov,
      height,
    );
  };

  /** World units ≈ one screen pixel in plan (grip sizing while syncing). */
  const planWorldPerPixel = () => orthoWorldPerPixel(orthoHalfH, height);

  const applyPickThreshold = () => {
    const threshold = pickLineThreshold(worldPerPixelAtPivot());
    raycaster.params.Line = { threshold };
    raycaster.params.Points = { threshold };
  };

  const syncSceneForMode = () => {
    axes.visible = mode !== "plan";
    sun.visible = mode !== "plan";
    planDoorsGroup.visible = mode === "plan";
    flipControlsGroup.visible = mode === "plan";
    camerasGroup.visible = mode === "plan";
    cropGroup.visible = mode === "plan";
    doorsGroup.visible = true;
    applyClippingState();
  };
  syncSceneForMode();

  const toNdc = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    ndc.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  };

  const clientFromWorld = (wx: number, wy: number, wz: number) => {
    const v = new Vector3(wx, wy, wz).project(activeCamera());
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
      behind: v.z > 1,
    };
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const direction = Math.sign(e.deltaY);
    const factor = direction > 0 ? 1.12 : 1 / 1.12;
    if (mode === "plan") {
      updateOrthoFrustum(Math.min(80, Math.max(1.5, orthoHalfH * factor)));
    } else if (useOrtho3d) {
      updateOrtho3dFrustum(Math.min(80, Math.max(1.5, ortho3dHalfH * factor)));
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

  // Orbit (3D) / pan (plan): middle or right button — left stays for tools
  let navActive = false;
  let navButton = -1;
  let lastX = 0;
  let lastY = 0;
  const spherical = new Spherical();
  const offsetVec = new Vector3();

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 1 && e.button !== 2) return;
    e.preventDefault();
    navActive = true;
    navButton = e.button;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };

  const orbit3dCamera = (dx: number, dy: number) => {
    const cam = useOrtho3d ? ortho3d : persp;
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

  const onPointerMove = (e: PointerEvent) => {
    if (!navActive) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    if (mode === "plan") {
      const scale = planWorldPerPixel();
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

  let raf = 0;
  const render = () => {
    raf = requestAnimationFrame(render);
    renderer.render(scene, activeCamera());
  };
  render();

  const pickEntityId = (
    clientX: number,
    clientY: number,
    group: Group,
    key: string,
  ): string | null => {
    applyPickThreshold();
    toNdc(clientX, clientY);
    raycaster.setFromCamera(ndc, activeCamera());
    const hits = raycaster.intersectObjects(group.children, true);
    for (const h of hits) {
      let o: typeof h.object | null = h.object;
      while (o) {
        const id = o.userData?.[key];
        if (typeof id === "string") return id;
        o = o.parent as typeof o;
        if (o === group) break;
      }
    }
    // Screen-space proximity when zoomed out
    const maxPx = ENTITY_PROXIMITY_PX;
    let bestId: string | null = null;
    let bestD = maxPx;
    const seen = new Set<string>();
    for (const child of group.children) {
      const id = child.userData?.[key];
      if (typeof id !== "string" || seen.has(id)) continue;
      seen.add(id);
      child.updateWorldMatrix(true, false);
      const geom = (child as Mesh).geometry;
      if (geom) {
        if (!geom.boundingSphere) geom.computeBoundingSphere();
        const bs = geom.boundingSphere;
        if (bs) {
          const c = bs.center.clone().applyMatrix4(child.matrixWorld);
          const scr = clientFromWorld(c.x, c.y, c.z);
          if (scr.behind) continue;
          const d = Math.hypot(scr.x - clientX, scr.y - clientY);
          if (d < bestD) {
            bestD = d;
            bestId = id;
          }
          continue;
        }
      }
      const wp = new Vector3();
      child.getWorldPosition(wp);
      const scr = clientFromWorld(wp.x, wp.y, wp.z);
      if (scr.behind) continue;
      const d = Math.hypot(scr.x - clientX, scr.y - clientY);
      if (d < bestD) {
        bestD = d;
        bestId = id;
      }
    }
    return bestId;
  };

  return {
    canvas,
    resize(w: number, h: number) {
      if (w <= 0 || h <= 0) return;
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      persp.aspect = w / h;
      persp.updateProjectionMatrix();
      updateOrthoFrustum();
      updateOrtho3dFrustum();
    },
    fitEmpty() {
      if (mode === "plan") applyPlanPose();
      else applyPerspPose();
      updateOrthoFrustum(10);
      updateOrtho3dFrustum(10);
    },
    fitWalls(walls) {
      const bounds = computeWallsFitBounds(walls);
      if (!bounds) {
        this.fitEmpty();
        return;
      }
      if (mode === "plan") {
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
        useOrtho3d = false;
        persp.position.set(framing.eye.x, framing.eye.y, framing.eye.z);
        persp.up.set(framing.up.x, framing.up.y, framing.up.z);
        persp.lookAt(orbitTarget);
        updateOrtho3dFrustum(framing.orthoHalfH);
      }
    },
    setProjection(next: ViewProjection) {
      mode = next;
      if (mode === "plan") {
        applyPlanPose();
      } else if (!useOrtho3d) {
        // Keep current 3D pose; ensure persp looks at pivot
        persp.lookAt(orbitTarget);
      }
      updateOrthoFrustum(orthoHalfH);
      updateOrtho3dFrustum(ortho3dHalfH);
      syncSceneForMode();
    },
    setOrbitPivot(point) {
      const cam = useOrtho3d ? ortho3d : persp;
      offsetVec.copy(cam.position).sub(orbitTarget);
      orbitTarget.set(point.x, point.y, point.z);
      cam.position.copy(orbitTarget).add(offsetVec);
      cam.lookAt(orbitTarget);
    },
    getOrbitPivot() {
      return { x: orbitTarget.x, y: orbitTarget.y, z: orbitTarget.z };
    },
    setCameraPreset(preset: CameraPreset) {
      if (mode === "plan") return;
      const dist = useOrtho3d
        ? ortho3d.position.distanceTo(orbitTarget)
        : persp.position.distanceTo(orbitTarget);
      const pose = resolveCameraPresetPose(preset, orbitTarget, dist);
      if (!pose.useOrtho3d) {
        useOrtho3d = false;
        persp.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
        persp.up.set(pose.up.x, pose.up.y, pose.up.z);
        persp.lookAt(orbitTarget);
        persp.updateProjectionMatrix();
      } else {
        useOrtho3d = true;
        ortho3d.position.set(pose.eye.x, pose.eye.y, pose.eye.z);
        ortho3d.up.set(pose.up.x, pose.up.y, pose.up.z);
        ortho3d.lookAt(orbitTarget);
        updateOrtho3dFrustum(pose.orthoHalfH);
      }
    },
    orbitByDelta(dx, dy) {
      if (mode === "plan") return;
      orbit3dCamera(dx, dy);
    },
    applyModelCamera(cam) {
      if (mode === "plan") return;
      useOrtho3d = false;
      orbitTarget.set(cam.target.x, cam.target.y, cam.target.z);
      persp.position.set(cam.eye.x, cam.eye.y, cam.eye.z);
      persp.up.set(0, 0, 1);
      persp.fov = Math.min(120, Math.max(10, cam.fov));
      persp.lookAt(orbitTarget);
      persp.updateProjectionMatrix();
    },
    syncWalls(
      walls,
      doors,
      windows,
      cameras,
      selectedWallId,
      selectedDoorId,
      selectedWindowId,
      selectedCameraId,
      sessionCrop = null,
      selectedCropFrameCameraId = null,
    ) {
      while (wallsGroup.children.length) {
        const child = wallsGroup.children[0]!;
        wallsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (doorsGroup.children.length) {
        const child = doorsGroup.children[0]!;
        doorsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (windowsGroup.children.length) {
        const child = windowsGroup.children[0]!;
        windowsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (planDoorsGroup.children.length) {
        const child = planDoorsGroup.children[0]!;
        planDoorsGroup.remove(child);
        if (child instanceof LineSegments) child.geometry.dispose();
      }
      while (flipControlsGroup.children.length) {
        const child = flipControlsGroup.children[0]!;
        flipControlsGroup.remove(child);
      }
      while (camerasGroup.children.length) {
        const child = camerasGroup.children[0]!;
        camerasGroup.remove(child);
        if (child instanceof LineSegments || child instanceof Mesh) {
          child.geometry.dispose();
        }
      }
      while (cropGroup.children.length) {
        const child = cropGroup.children[0]!;
        cropGroup.remove(child);
        if (child instanceof LineSegments || child instanceof Mesh) {
          child.geometry.dispose();
        }
      }

      const addCropOverlay = (
        crop: ViewCrop,
        selected: boolean,
        cameraId: string | null,
      ) => {
        if (!crop.enabled) return;
        // Above plan crop masks (z=12) so the frame stays visible
        const frameZ = 12.2;
        const geom = new BufferGeometry();
        geom.setAttribute(
          "position",
          new BufferAttribute(viewCropPlanLines(crop, frameZ), 3),
        );
        const lines = new LineSegments(
          geom,
          selected ? cropLineSelectedMat : cropLineMat,
        );
        if (cameraId) {
          lines.userData.cropFrame = true;
          lines.userData.cameraId = cameraId;
        }
        cropGroup.add(lines);
        if (!selected) return;
        for (const c of viewCropCorners(crop, frameZ + 0.05)) {
          const grip = new Mesh(flipSphereGeom, cropGripMat);
          grip.position.set(c.x, c.y, c.z);
          const minR = screenScaledRadius(
            planWorldPerPixel(),
            CROP_GRIP_RADIUS_PX,
            MIN_CROP_GRIP_RADIUS,
          );
          grip.scale.setScalar(minR);
          grip.userData.cropGrip = true;
          grip.userData.corner = c.corner;
          grip.userData.cameraId = cameraId;
          cropGroup.add(grip);
        }
      };

      const joins = computeWallJoinDirs(walls);
      for (const wall of walls) {
        const j = joins.get(wall.id);
        const openings = openingsFromHosted(wall.id, doors, windows);
        const buffer = wallMeshWithOpenings(
          wall,
          openings,
          openings.length
            ? undefined
            : {
                joinStartAway: j?.startAway ?? null,
                joinEndAway: j?.endAway ?? null,
              },
        );
        if (buffer.positions.length === 0) continue;
        const mesh = new Mesh(
          meshFromBuffer(buffer),
          wall.id === selectedWallId ? wallSelectedMat : wallMat,
        );
        mesh.userData.wallId = wall.id;
        wallsGroup.add(mesh);
      }
      for (const door of doors) {
        const host = walls.find((w) => w.id === door.wallId);
        if (!host) continue;
        const selected = door.id === selectedDoorId;
        const parts = doorAssemblyMeshes(host, door);
        const addPart = (buffer: MeshBuffer, mat: MeshLambertMaterial) => {
          if (buffer.positions.length === 0) return;
          const mesh = new Mesh(meshFromBuffer(buffer), mat);
          mesh.userData.doorId = door.id;
          doorsGroup.add(mesh);
        };
        addPart(parts.frame, selected ? doorFrameSelectedMat : doorFrameMat);
        addPart(parts.leaf, selected ? doorSelectedMat : doorMat);
        addPart(parts.hardware, selected ? doorHardwareSelectedMat : doorHardwareMat);

        const symbol = doorPlanSymbol(host, door);
        if (symbol) {
          const geom = new BufferGeometry();
          geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
          const lines = new LineSegments(
            geom,
            selected ? planDoorLineSelectedMat : planDoorLineMat,
          );
          lines.userData.doorId = door.id;
          planDoorsGroup.add(lines);

          if (selected) {
            for (const ctrl of symbol.flipControls) {
              const grip = new Mesh(
                flipSphereGeom,
                ctrl.kind === "swing" ? flipSwingMat : flipHingeMat,
              );
              grip.position.set(ctrl.x, ctrl.y, ctrl.z);
              const minR = screenScaledRadius(
                planWorldPerPixel(),
                FLIP_CONTROL_RADIUS_PX,
                ctrl.hitRadius,
              );
              grip.scale.setScalar(minR);
              grip.userData.flipControl = true;
              grip.userData.entityType = ctrl.entityType;
              grip.userData.entityId = ctrl.entityId;
              grip.userData.kind = ctrl.kind;
              flipControlsGroup.add(grip);
            }
          }
        }
      }
      for (const win of windows) {
        const host = walls.find((w) => w.id === win.wallId);
        if (!host) continue;
        const selected = win.id === selectedWindowId;
        const parts = windowAssemblyMeshes(host, win);
        const addPart = (buffer: MeshBuffer, mat: MeshLambertMaterial) => {
          if (buffer.positions.length === 0) return;
          const mesh = new Mesh(meshFromBuffer(buffer), mat);
          mesh.userData.windowId = win.id;
          windowsGroup.add(mesh);
        };
        addPart(parts.frame, selected ? windowFrameSelectedMat : windowFrameMat);
        addPart(parts.sash, selected ? windowSashSelectedMat : windowSashMat);
        addPart(parts.glass, selected ? windowGlassSelectedMat : windowGlassMat);

        const symbol = windowPlanSymbol(host, win);
        if (symbol) {
          const geom = new BufferGeometry();
          geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
          const lines = new LineSegments(
            geom,
            selected ? planDoorLineSelectedMat : planDoorLineMat,
          );
          lines.userData.windowId = win.id;
          planDoorsGroup.add(lines);

          if (selected) {
            for (const ctrl of symbol.flipControls) {
              const grip = new Mesh(
                flipSphereGeom,
                ctrl.kind === "swing" ? flipSwingMat : flipHingeMat,
              );
              grip.position.set(ctrl.x, ctrl.y, ctrl.z);
              const minR = screenScaledRadius(
                planWorldPerPixel(),
                FLIP_CONTROL_RADIUS_PX,
                ctrl.hitRadius,
              );
              grip.scale.setScalar(minR);
              grip.userData.flipControl = true;
              grip.userData.entityType = ctrl.entityType;
              grip.userData.entityId = ctrl.entityId;
              grip.userData.kind = ctrl.kind;
              flipControlsGroup.add(grip);
            }
          }
        }
      }
      for (const cam of cameras) {
        const selected = cam.id === selectedCameraId;
        const symbol = cameraPlanSymbol(cam);
        const geom = new BufferGeometry();
        geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
        const lines = new LineSegments(
          geom,
          selected ? cameraLineSelectedMat : cameraLineMat,
        );
        lines.userData.cameraId = cam.id;
        camerasGroup.add(lines);

        // Plan: cone + crop frame when camera selected; grips when frame selected
        if (selected && cam.crop?.enabled) {
          const coneGeom = new BufferGeometry();
          coneGeom.setAttribute(
            "position",
            new BufferAttribute(cameraVisionConeLines(cam), 3),
          );
          const cone = new LineSegments(coneGeom, cameraConeSelectedMat);
          cone.userData.cameraId = cam.id;
          camerasGroup.add(cone);

          const frameSelected = selectedCropFrameCameraId === cam.id;
          addCropOverlay(cam.crop, frameSelected, cam.id);
        }

        const pick = new Mesh(
          cameraPickGeom,
          selected ? cameraPickSelectedMat : cameraPickMat,
        );
        pick.position.set(symbol.pick.x, symbol.pick.y, symbol.pick.z);
        const r = screenScaledRadius(
          planWorldPerPixel(),
          CAMERA_PICK_RADIUS_PX,
          MIN_CAMERA_PICK_RADIUS,
        );
        pick.scale.setScalar(r);
        pick.userData.cameraId = cam.id;
        camerasGroup.add(pick);
      }
      // Independent plan/presentation crop (clips geometry only via getClippingCrop)
      if (sessionCrop?.enabled) {
        addCropOverlay(sessionCrop, !selectedCameraId && !selectedCropFrameCameraId, null);
      }
    },
    setClippingCrop(crop) {
      currentClipCrop = crop;
      applyClippingState();
    },
    setPreviewSegment(p1, p2) {
      if (!p1 || !p2) {
        previewLine.visible = false;
        return;
      }
      const arr = previewGeom.getAttribute("position") as BufferAttribute;
      arr.setXYZ(0, p1.x, p1.y, p1.z + 0.05);
      arr.setXYZ(1, p2.x, p2.y, p2.z + 0.05);
      arr.needsUpdate = true;
      previewLine.visible = true;
    },
    setSnapCue(point, kind, pending = null) {
      if (!point || kind === "none") {
        // Still show a faint cursor mark when free-drawing with pending
        if (point && pending) {
          const s = 0.12;
          const z = point.z + 0.08;
          const arr = snapMarkerGeom.getAttribute("position") as BufferAttribute;
          arr.setXYZ(0, point.x - s, point.y, z);
          arr.setXYZ(1, point.x + s, point.y, z);
          arr.setXYZ(2, point.x, point.y - s, z);
          arr.setXYZ(3, point.x, point.y + s, z);
          arr.needsUpdate = true;
          snapMarkerMat.color.setHex(snapColors.none);
          snapMarker.visible = true;
          snapGuide.visible = false;
          previewMat.color.setHex(0xb0b8c0);
          return;
        }
        snapMarker.visible = false;
        snapGuide.visible = false;
        previewMat.color.setHex(0xd4a15a);
        return;
      }

      const s = kind === "close" || kind === "endpoint" ? 0.22 : 0.16;
      const z = point.z + 0.08;
      const arr = snapMarkerGeom.getAttribute("position") as BufferAttribute;
      arr.setXYZ(0, point.x - s, point.y, z);
      arr.setXYZ(1, point.x + s, point.y, z);
      arr.setXYZ(2, point.x, point.y - s, z);
      arr.setXYZ(3, point.x, point.y + s, z);
      arr.needsUpdate = true;
      snapMarkerMat.color.setHex(snapColors[kind]);
      snapMarker.visible = true;
      previewMat.color.setHex(snapColors[kind]);

      if (pending && (kind === "ortho" || kind === "close")) {
        const g = snapGuideGeom.getAttribute("position") as BufferAttribute;
        g.setXYZ(0, pending.x, pending.y, pending.z + 0.04);
        g.setXYZ(1, point.x, point.y, point.z + 0.04);
        g.needsUpdate = true;
        snapGuideMat.color.setHex(snapColors[kind]);
        snapGuide.visible = true;
      } else {
        snapGuide.visible = false;
      }
    },
    pickGround(clientX, clientY, elevation = 0) {
      applyPickThreshold();
      toNdc(clientX, clientY);
      raycaster.setFromCamera(ndc, activeCamera());
      groundPlane.constant = -elevation;
      const ok = raycaster.ray.intersectPlane(groundPlane, hit);
      if (!ok) return null;
      return { x: hit.x, y: hit.y, z: elevation };
    },
    pickWallId(clientX, clientY) {
      return pickEntityId(clientX, clientY, wallsGroup, "wallId");
    },
    pickDoorId(clientX, clientY) {
      const fromSolid = pickEntityId(clientX, clientY, doorsGroup, "doorId");
      if (fromSolid) return fromSolid;
      if (mode === "plan") {
        return pickEntityId(clientX, clientY, planDoorsGroup, "doorId");
      }
      return null;
    },
    pickWindowId(clientX, clientY) {
      const fromSolid = pickEntityId(clientX, clientY, windowsGroup, "windowId");
      if (fromSolid) return fromSolid;
      if (mode === "plan") {
        return pickEntityId(clientX, clientY, planDoorsGroup, "windowId");
      }
      return null;
    },
    pickCameraId(clientX, clientY) {
      if (mode !== "plan") return null;
      return pickEntityId(clientX, clientY, camerasGroup, "cameraId");
    },
    pickFlipControl(clientX, clientY) {
      if (mode !== "plan" || !flipControlsGroup.visible) return null;
      applyPickThreshold();
      toNdc(clientX, clientY);
      raycaster.setFromCamera(ndc, activeCamera());
      const hits = raycaster.intersectObjects(flipControlsGroup.children, false);
      let obj: (typeof flipControlsGroup.children)[number] | undefined =
        hits[0]?.object;
      if (!obj?.userData?.flipControl) {
        // Proximity fallback for tiny grips when zoomed out
        const maxPx = FLIP_CONTROL_PROXIMITY_PX;
        let bestD = maxPx;
        let best: (typeof flipControlsGroup.children)[number] | undefined;
        for (const child of flipControlsGroup.children) {
          if (!child.userData?.flipControl) continue;
          const wp = new Vector3();
          child.getWorldPosition(wp);
          const scr = clientFromWorld(wp.x, wp.y, wp.z);
          if (scr.behind) continue;
          const d = Math.hypot(scr.x - clientX, scr.y - clientY);
          if (d < bestD) {
            bestD = d;
            best = child;
          }
        }
        obj = best;
      }
      if (!obj?.userData?.flipControl) return null;
      const entityId = obj.userData.entityId;
      const kind = obj.userData.kind;
      const entityType = obj.userData.entityType;
      if (
        (entityType !== "door" && entityType !== "window") ||
        typeof entityId !== "string" ||
        (kind !== "swing" && kind !== "hinge")
      ) {
        return null;
      }
      return { entityType, entityId, kind };
    },
    pickCropGrip(clientX, clientY) {
      if (mode !== "plan" || !cropGroup.visible) return null;
      toNdc(clientX, clientY);
      applyPickThreshold();
      raycaster.setFromCamera(ndc, activeCamera());
      const hits = raycaster.intersectObjects(cropGroup.children, false);
      for (const hit of hits) {
        const obj = hit.object;
        if (!obj.userData?.cropGrip) continue;
        const corner = obj.userData.corner;
        if (corner !== 0 && corner !== 1 && corner !== 2 && corner !== 3) continue;
        const cameraId =
          typeof obj.userData.cameraId === "string" ? obj.userData.cameraId : null;
        return { corner, cameraId };
      }
      // Proximity fallback
      const maxPx = CROP_GRIP_PROXIMITY_PX;
      let best: CropGripPick | null = null;
      let bestD = maxPx;
      for (const child of cropGroup.children) {
        if (!child.userData?.cropGrip) continue;
        const corner = child.userData.corner;
        if (corner !== 0 && corner !== 1 && corner !== 2 && corner !== 3) continue;
        const scr = clientFromWorld(child.position.x, child.position.y, child.position.z);
        if (scr.behind) continue;
        const d = Math.hypot(scr.x - clientX, scr.y - clientY);
        if (d < bestD) {
          bestD = d;
          best = {
            corner,
            cameraId:
              typeof child.userData.cameraId === "string"
                ? child.userData.cameraId
                : null,
          };
        }
      }
      return best;
    },
    pickCropFrame(clientX, clientY) {
      if (mode !== "plan" || !cropGroup.visible) return null;
      toNdc(clientX, clientY);
      applyPickThreshold();
      raycaster.setFromCamera(ndc, activeCamera());
      const hits = raycaster.intersectObjects(cropGroup.children, false);
      for (const hit of hits) {
        const obj = hit.object;
        if (!obj.userData?.cropFrame) continue;
        if (typeof obj.userData.cameraId !== "string") continue;
        return { cameraId: obj.userData.cameraId };
      }
      // Screen-proximity to frame corners/edges (thin lines)
      const maxPx = CROP_FRAME_PROXIMITY_PX;
      let bestId: string | null = null;
      let bestD = maxPx;
      for (const child of cropGroup.children) {
        if (!child.userData?.cropFrame) continue;
        if (typeof child.userData.cameraId !== "string") continue;
        if (!(child instanceof LineSegments)) continue;
        const pos = child.geometry.getAttribute("position");
        if (!pos) continue;
        for (let i = 0; i < pos.count; i++) {
          const scr = clientFromWorld(pos.getX(i), pos.getY(i), pos.getZ(i));
          if (scr.behind) continue;
          const d = Math.hypot(scr.x - clientX, scr.y - clientY);
          if (d < bestD) {
            bestD = d;
            bestId = child.userData.cameraId;
          }
        }
      }
      return bestId ? { cameraId: bestId } : null;
    },
    dispose() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      grid.geometry.dispose();
      const gridMat = grid.material;
      if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
      else gridMat.dispose();
      wallMat.dispose();
      wallSelectedMat.dispose();
      doorMat.dispose();
      doorSelectedMat.dispose();
      doorFrameMat.dispose();
      doorFrameSelectedMat.dispose();
      doorHardwareMat.dispose();
      doorHardwareSelectedMat.dispose();
      windowFrameMat.dispose();
      windowFrameSelectedMat.dispose();
      windowSashMat.dispose();
      windowSashSelectedMat.dispose();
      windowGlassMat.dispose();
      windowGlassSelectedMat.dispose();
      planDoorLineMat.dispose();
      planDoorLineSelectedMat.dispose();
      cameraLineMat.dispose();
      cameraLineSelectedMat.dispose();
      cameraConeSelectedMat.dispose();
      cropLineMat.dispose();
      cropLineSelectedMat.dispose();
      cropGripMat.dispose();
      cropMaskMat.dispose();
      clearGroupMeshes(cropMaskGroup);
      cameraPickMat.dispose();
      cameraPickSelectedMat.dispose();
      cameraPickGeom.dispose();
      flipSwingMat.dispose();
      flipHingeMat.dispose();
      flipSphereGeom.dispose();
      previewGeom.dispose();
      previewMat.dispose();
      snapMarkerGeom.dispose();
      snapMarkerMat.dispose();
      snapGuideGeom.dispose();
      snapGuideMat.dispose();
      while (wallsGroup.children.length) {
        const child = wallsGroup.children[0]!;
        wallsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (doorsGroup.children.length) {
        const child = doorsGroup.children[0]!;
        doorsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (windowsGroup.children.length) {
        const child = windowsGroup.children[0]!;
        windowsGroup.remove(child);
        if (child instanceof Mesh) child.geometry.dispose();
      }
      while (planDoorsGroup.children.length) {
        const child = planDoorsGroup.children[0]!;
        planDoorsGroup.remove(child);
        if (child instanceof LineSegments) child.geometry.dispose();
      }
      while (flipControlsGroup.children.length) {
        flipControlsGroup.remove(flipControlsGroup.children[0]!);
      }
      while (camerasGroup.children.length) {
        const child = camerasGroup.children[0]!;
        camerasGroup.remove(child);
        if (child instanceof LineSegments || child instanceof Mesh) {
          child.geometry.dispose();
        }
      }
      while (cropGroup.children.length) {
        const child = cropGroup.children[0]!;
        cropGroup.remove(child);
        if (child instanceof LineSegments || child instanceof Mesh) {
          child.geometry.dispose();
        }
      }
      renderer.dispose();
    },
  };
}
