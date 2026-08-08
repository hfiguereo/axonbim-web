import type { ViewCrop } from "@axonbim/model";
import {
  OrthographicCamera,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  orthoWorldPerPixel,
  perspectiveWorldPerPixel,
  pickLineThreshold,
} from "./pickTolerance.js";
import type { ViewportSceneGraph } from "./viewportSceneGraph.js";
import { createClipPlanePool } from "./viewCropClip.js";

export type ViewProjection = "perspective" | "plan";

export type ViewportContext = {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  sg: ViewportSceneGraph;
  width: number;
  height: number;
  mode: ViewProjection;
  persp: PerspectiveCamera;
  ortho: OrthographicCamera;
  ortho3d: OrthographicCamera;
  orthoHalfH: number;
  ortho3dHalfH: number;
  orbitTarget: Vector3;
  useOrtho3d: boolean;
  raycaster: Raycaster;
  ndc: Vector2;
  groundPlane: Plane;
  hit: Vector3;
  clipPlanePool: ReturnType<typeof createClipPlanePool>;
  currentClipCrop: ViewCrop | null;
  activeCamera: () => PerspectiveCamera | OrthographicCamera;
  toNdc: (clientX: number, clientY: number) => void;
  clientFromWorld: (
    wx: number,
    wy: number,
    wz: number,
  ) => { x: number; y: number; behind: boolean };
  worldPerPixelAtPivot: () => number;
  planWorldPerPixel: () => number;
  applyPickThreshold: () => void;
  syncSceneForMode: (applyClippingState: () => void) => void;
};

export type CreateViewportContextOptions = {
  canvas: HTMLCanvasElement;
  sg: ViewportSceneGraph;
  renderer: WebGLRenderer;
  initialProjection: ViewProjection;
};

export function createViewportContext(
  options: CreateViewportContextOptions,
): ViewportContext {
  const { canvas, sg, renderer, initialProjection } = options;

  const ctx: ViewportContext = {
    canvas,
    renderer,
    sg,
    width: 1,
    height: 1,
    mode: initialProjection,
    persp: null!,
    ortho: null!,
    ortho3d: null!,
    orthoHalfH: 10,
    ortho3dHalfH: 10,
    orbitTarget: new Vector3(0, 0, 0),
    useOrtho3d: false,
    raycaster: new Raycaster(),
    ndc: new Vector2(),
    groundPlane: new Plane(new Vector3(0, 0, 1), 0),
    hit: new Vector3(),
    clipPlanePool: createClipPlanePool(),
    currentClipCrop: null,
    activeCamera: () => ctx.persp,
    toNdc: () => {},
    clientFromWorld: () => ({ x: 0, y: 0, behind: false }),
    worldPerPixelAtPivot: () => 1,
    planWorldPerPixel: () => 1,
    applyPickThreshold: () => {},
    syncSceneForMode: () => {},
  };

  ctx.persp = new PerspectiveCamera(45, 1, 0.05, 500);
  ctx.persp.up.set(0, 0, 1);

  ctx.ortho = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ctx.ortho.up.set(0, 1, 0);

  ctx.ortho3d = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ctx.ortho3d.up.set(0, 0, 1);

  ctx.activeCamera = () => {
    if (ctx.mode === "plan") return ctx.ortho;
    return ctx.useOrtho3d ? ctx.ortho3d : ctx.persp;
  };

  ctx.worldPerPixelAtPivot = () => {
    const cam = ctx.activeCamera();
    if (cam instanceof OrthographicCamera) {
      return orthoWorldPerPixel(
        ctx.mode === "plan" ? ctx.orthoHalfH : ctx.ortho3dHalfH,
        ctx.height,
      );
    }
    return perspectiveWorldPerPixel(
      cam.position.distanceTo(ctx.orbitTarget),
      (cam as PerspectiveCamera).fov,
      ctx.height,
    );
  };

  ctx.planWorldPerPixel = () => orthoWorldPerPixel(ctx.orthoHalfH, ctx.height);

  ctx.applyPickThreshold = () => {
    const threshold = pickLineThreshold(ctx.worldPerPixelAtPivot());
    ctx.raycaster.params.Line = { threshold };
    ctx.raycaster.params.Points = { threshold };
  };

  ctx.toNdc = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ctx.ndc.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    ctx.ndc.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  };

  ctx.clientFromWorld = (wx: number, wy: number, wz: number) => {
    const v = new Vector3(wx, wy, wz).project(ctx.activeCamera());
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
      behind: v.z > 1,
    };
  };

  ctx.syncSceneForMode = (applyClippingState: () => void) => {
    const { axes, sun, planDoorsGroup, flipControlsGroup, camerasGroup, cropGroup, doorsGroup } =
      ctx.sg;
    axes.visible = ctx.mode !== "plan";
    sun.visible = ctx.mode !== "plan";
    planDoorsGroup.visible = ctx.mode === "plan";
    flipControlsGroup.visible = ctx.mode === "plan";
    camerasGroup.visible = ctx.mode === "plan";
    cropGroup.visible = ctx.mode === "plan";
    doorsGroup.visible = true;
    applyClippingState();
  };

  return ctx;
}
