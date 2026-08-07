import { computeWallJoinDirs, wallBoxMesh, type MeshBuffer } from "@axonbim/geometry";
import type { Wall } from "@axonbim/model";
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
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

export type ViewProjection = "perspective" | "plan";

export type ViewportHandle = {
  canvas: HTMLCanvasElement;
  resize: (width: number, height: number) => void;
  dispose: () => void;
  fitEmpty: () => void;
  fitWalls: (walls: Wall[]) => void;
  setProjection: (mode: ViewProjection) => void;
  syncWalls: (walls: Wall[], selectedId: string | null) => void;
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

  const scene = new Scene();
  scene.background = new Color(background);

  let width = 1;
  let height = 1;
  let mode: ViewProjection = initial;

  const persp = new PerspectiveCamera(45, 1, 0.05, 500);
  persp.up.set(0, 0, 1);

  const ortho = new OrthographicCamera(-10, 10, 10, -10, 0.05, 500);
  ortho.up.set(0, 1, 0);
  let orthoHalfH = 10;
  let perspTarget = new Vector3(0, 0, 0);

  const applyPerspPose = () => {
    persp.position.set(8, -10, 7);
    perspTarget.set(0, 0, 0);
    persp.lookAt(perspTarget);
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

  const activeCamera = () => (mode === "plan" ? ortho : persp);

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

  const syncSceneForMode = () => {
    axes.visible = mode !== "plan";
    sun.visible = mode !== "plan";
  };
  syncSceneForMode();

  const toNdc = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    ndc.y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const direction = Math.sign(e.deltaY);
    const factor = direction > 0 ? 1.12 : 1 / 1.12;
    if (mode === "plan") {
      updateOrthoFrustum(Math.min(80, Math.max(1.5, orthoHalfH * factor)));
    } else {
      const offset = persp.position.clone().sub(perspTarget);
      const dist = offset.length();
      const nextDist = Math.min(120, Math.max(2, dist * factor));
      offset.setLength(nextDist);
      persp.position.copy(perspTarget).add(offset);
      persp.lookAt(perspTarget);
    }
  };
  canvas.addEventListener("wheel", onWheel, { passive: false });

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
      updateOrthoFrustum(10);
    },
    fitWalls(walls) {
      if (walls.length === 0) {
        this.fitEmpty();
        return;
      }
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const w of walls) {
        minX = Math.min(minX, w.p1.x, w.p2.x);
        maxX = Math.max(maxX, w.p1.x, w.p2.x);
        minY = Math.min(minY, w.p1.y, w.p2.y);
        maxY = Math.max(maxY, w.p1.y, w.p2.y);
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const span = Math.max(maxX - minX, maxY - minY, 2) * 0.7 + 2;
      if (mode === "plan") {
        ortho.position.set(cx, cy, 40);
        ortho.lookAt(cx, cy, 0);
        updateOrthoFrustum(span);
      } else {
        perspTarget.set(cx, cy, 1);
        persp.position.set(cx + span, cy - span * 1.2, span * 0.9);
        persp.lookAt(perspTarget);
      }
    },
    setProjection(next: ViewProjection) {
      mode = next;
      if (mode === "plan") applyPlanPose();
      else applyPerspPose();
      updateOrthoFrustum(orthoHalfH);
      syncSceneForMode();
    },
    syncWalls(walls, selectedId) {
      while (wallsGroup.children.length) {
        const child = wallsGroup.children[0]!;
        wallsGroup.remove(child);
        if (child instanceof Mesh) {
          child.geometry.dispose();
        }
      }
      const joins = computeWallJoinDirs(walls);
      for (const wall of walls) {
        const j = joins.get(wall.id);
        const buffer = wallBoxMesh(wall, {
          joinStartAway: j?.startAway ?? null,
          joinEndAway: j?.endAway ?? null,
        });
        if (buffer.positions.length === 0) continue;
        const mesh = new Mesh(
          meshFromBuffer(buffer),
          wall.id === selectedId ? wallSelectedMat : wallMat,
        );
        mesh.userData.wallId = wall.id;
        wallsGroup.add(mesh);
      }
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
      toNdc(clientX, clientY);
      raycaster.setFromCamera(ndc, activeCamera());
      groundPlane.constant = -elevation;
      const ok = raycaster.ray.intersectPlane(groundPlane, hit);
      if (!ok) return null;
      return { x: hit.x, y: hit.y, z: elevation };
    },
    pickWallId(clientX, clientY) {
      toNdc(clientX, clientY);
      raycaster.setFromCamera(ndc, activeCamera());
      const hits = raycaster.intersectObjects(wallsGroup.children, false);
      const first = hits[0]?.object;
      const id = first?.userData?.wallId;
      return typeof id === "string" ? id : null;
    },
    dispose() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("wheel", onWheel);
      grid.geometry.dispose();
      const gridMat = grid.material;
      if (Array.isArray(gridMat)) gridMat.forEach((m) => m.dispose());
      else gridMat.dispose();
      wallMat.dispose();
      wallSelectedMat.dispose();
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
      renderer.dispose();
    },
  };
}
