import {
  AmbientLight,
  AxesHelper,
  Color,
  DirectionalLight,
  GridHelper,
  OrthographicCamera,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";

export type ViewProjection = "perspective" | "plan";

export type ViewportHandle = {
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  fitEmpty: () => void;
  setProjection: (mode: ViewProjection) => void;
};

export type CreateViewportOptions = {
  canvas: HTMLCanvasElement;
  background?: string;
  projection?: ViewProjection;
};

/** Three.js representation adapter — perspective or orthographic plan. */
export function createViewport(options: CreateViewportOptions): ViewportHandle {
  const { canvas, background = "#1c2228", projection: initial = "perspective" } = options;

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new Scene();
  scene.background = new Color(background);

  let width = 1;
  let height = 1;
  let mode: ViewProjection = initial;

  const persp = new PerspectiveCamera(45, 1, 0.05, 500);
  persp.up.set(0, 0, 1);

  const ortho = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ortho.up.set(0, 1, 0);

  const applyPerspPose = () => {
    persp.position.set(8, -10, 7);
    persp.lookAt(0, 0, 0);
  };

  const applyPlanPose = () => {
    // Looking straight down onto XY (planta / ortogonal).
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

  const grid = new GridHelper(20, 20, 0x5a6a78, 0x2f3a44);
  grid.rotation.x = Math.PI / 2;
  scene.add(grid);
  const axes = new AxesHelper(1.5);
  scene.add(axes);

  const activeCamera = () => (mode === "plan" ? ortho : persp);

  const updateOrthoFrustum = () => {
    const aspect = width / Math.max(height, 1);
    const halfH = 10;
    const halfW = halfH * aspect;
    ortho.left = -halfW;
    ortho.right = halfW;
    ortho.top = halfH;
    ortho.bottom = -halfH;
    ortho.updateProjectionMatrix();
  };

  const syncSceneForMode = () => {
    // Plan: flat XY look — mute Z axis emphasis by hiding axes helper.
    axes.visible = mode !== "plan";
    sun.visible = mode !== "plan";
  };
  syncSceneForMode();

  let raf = 0;
  const render = () => {
    raf = requestAnimationFrame(render);
    renderer.render(scene, activeCamera());
  };
  render();

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
    },
    fitEmpty() {
      if (mode === "plan") applyPlanPose();
      else applyPerspPose();
      updateOrthoFrustum();
    },
    setProjection(next: ViewProjection) {
      mode = next;
      if (mode === "plan") applyPlanPose();
      else applyPerspPose();
      updateOrthoFrustum();
      syncSceneForMode();
    },
    dispose() {
      cancelAnimationFrame(raf);
      grid.geometry.dispose();
      const gridMat = grid.material;
      if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
      else gridMat.dispose();
      renderer.dispose();
    },
  };
}
