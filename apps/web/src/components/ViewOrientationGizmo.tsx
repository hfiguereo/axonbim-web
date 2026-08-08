import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshLambertMaterial,
  OrthographicCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import type { CameraPreset } from "@axonbim/viewer";
import { useSessionStore } from "../sessionStore";

type TipId =
  | "xp"
  | "xn"
  | "yp"
  | "yn"
  | "zp"
  | "zn"
  | "hub";

const TIP_META: Record<
  Exclude<TipId, "hub">,
  {
    label: string;
    color: number;
    dir: [number, number, number];
    preset: Exclude<CameraPreset, "iso">;
  }
> = {
  xp: { label: "X+ · derecha · orto", color: 0xe05a5a, dir: [1, 0, 0], preset: "right" },
  xn: { label: "X− · izquierda · orto", color: 0xa04848, dir: [-1, 0, 0], preset: "left" },
  // Camera looks along −Y for “front” (ADR 0014)
  yp: { label: "Y+ · atrás · orto", color: 0x489a48, dir: [0, 1, 0], preset: "back" },
  yn: { label: "Y− · frente · orto", color: 0x5bb85b, dir: [0, -1, 0], preset: "front" },
  zp: { label: "Z+ · arriba · orto", color: 0x5a8ae0, dir: [0, 0, 1], preset: "top" },
  zn: { label: "Z− · abajo · orto", color: 0x4870b8, dir: [0, 0, -1], preset: "bottom" },
};

const HOLD_MS = 180;
const DRAG_PX = 5;

type ViewOrientationGizmoProps = {
  visible: boolean;
  /** Orbit main 3D viewport (screen px delta). */
  onOrbit?: (dx: number, dy: number) => void;
};

/**
 * Tríada ±X/±Y/±Z + hub iso (híbrido ADR 0012/0014).
 * Clic corto → preset; hold/drag → órbita del modelo.
 */
export function ViewOrientationGizmo({ visible, onOrbit }: ViewOrientationGizmoProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onOrbitRef = useRef(onOrbit);
  onOrbitRef.current = onOrbit;
  const requestCameraPreset = useSessionStore((s) => s.requestCameraPreset);
  const [hover, setHover] = useState<{
    id: TipId;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const size = 104;
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1.4, 1.4, 1.4, -1.4, 0.1, 20);
    camera.position.set(2.25, -2.45, 2.15);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    scene.add(new AmbientLight(0xffffff, 0.78));
    const sun = new DirectionalLight(0xffffff, 0.88);
    sun.position.set(3, -2, 4);
    scene.add(sun);

    const root = new Group();
    scene.add(root);

    const tipMeshes: Mesh[] = [];
    const tipById = new Map<TipId, { tip: Mesh; mat: MeshLambertMaterial }>();
    const disposeGeoms: Array<{ dispose: () => void }> = [];
    const disposeMats: MeshLambertMaterial[] = [];

    const orientShaft = (shaft: Mesh, dir: [number, number, number]) => {
      // Cylinder default axis = +Y; rotate to `dir`
      const target = new Vector3(dir[0], dir[1], dir[2]).normalize();
      const quat = new Vector3(0, 1, 0);
      shaft.quaternion.setFromUnitVectors(quat, target);
    };

    const makeFullAxis = (
      posId: Exclude<TipId, "hub">,
      negId: Exclude<TipId, "hub">,
    ) => {
      const pos = TIP_META[posId];
      const neg = TIP_META[negId];
      const shaftMat = new MeshLambertMaterial({ color: pos.color });
      disposeMats.push(shaftMat);
      const shaftGeom = new CylinderGeometry(0.04, 0.04, 1.35, 12);
      disposeGeoms.push(shaftGeom);
      const shaft = new Mesh(shaftGeom, shaftMat);
      orientShaft(shaft, pos.dir);

      const tipGeom = new SphereGeometry(0.11, 14, 12);
      disposeGeoms.push(tipGeom);
      const tipPosMat = new MeshLambertMaterial({ color: pos.color });
      const tipNegMat = new MeshLambertMaterial({ color: neg.color });
      disposeMats.push(tipPosMat, tipNegMat);

      const tipPos = new Mesh(tipGeom, tipPosMat);
      tipPos.position.set(pos.dir[0] * 0.72, pos.dir[1] * 0.72, pos.dir[2] * 0.72);
      tipPos.userData.tipId = posId;
      tipMeshes.push(tipPos);
      tipById.set(posId, { tip: tipPos, mat: tipPosMat });

      const tipNeg = new Mesh(tipGeom, tipNegMat);
      tipNeg.position.set(neg.dir[0] * 0.72, neg.dir[1] * 0.72, neg.dir[2] * 0.72);
      tipNeg.userData.tipId = negId;
      tipMeshes.push(tipNeg);
      tipById.set(negId, { tip: tipNeg, mat: tipNegMat });

      const g = new Group();
      g.add(shaft);
      g.add(tipPos);
      g.add(tipNeg);
      root.add(g);
    };

    makeFullAxis("xp", "xn");
    makeFullAxis("yp", "yn");
    makeFullAxis("zp", "zn");

    const hubMat = new MeshLambertMaterial({ color: 0xc8cdd2 });
    disposeMats.push(hubMat);
    const hubGeom = new SphereGeometry(0.12, 16, 12);
    disposeGeoms.push(hubGeom);
    const hub = new Mesh(hubGeom, hubMat);
    hub.userData.tipId = "hub";
    tipMeshes.push(hub);
    tipById.set("hub", { tip: hub, mat: hubMat });
    root.add(hub);

    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let raf = 0;

    const setHighlight = (id: TipId | null) => {
      for (const [tid, entry] of tipById) {
        const on = tid === id;
        entry.tip.scale.setScalar(on ? 1.28 : 1);
        entry.mat.emissive = new Color(on ? 0x333333 : 0x000000);
      }
    };

    const pickTip = (clientX: number, clientY: number): TipId | null => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
      ndc.y = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(tipMeshes, false);
      const id = hits[0]?.object.userData.tipId as TipId | undefined;
      return id ?? null;
    };

    const projectTip = (obj: Mesh) => {
      const v = new Vector3().copy(obj.getWorldPosition(new Vector3()));
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * size,
        y: (-v.y * 0.5 + 0.5) * size,
      };
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
    render();

    let pressActive = false;
    let orbiting = false;
    let pressTip: TipId | null = null;
    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const clearHoldTimer = () => {
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const beginOrbit = () => {
      if (orbiting) return;
      orbiting = true;
      clearHoldTimer();
      setHover(null);
    };

    const applyPreset = (id: TipId) => {
      if (id === "hub") {
        requestCameraPreset("iso");
        return;
      }
      requestCameraPreset(TIP_META[id].preset);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      pressActive = true;
      orbiting = false;
      pressTip = pickTip(e.clientX, e.clientY);
      lastX = e.clientX;
      lastY = e.clientY;
      startX = e.clientX;
      startY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      clearHoldTimer();
      holdTimer = setTimeout(() => {
        if (pressActive) beginOrbit();
      }, HOLD_MS);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pressActive) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (!orbiting && moved > DRAG_PX) beginOrbit();
        if (orbiting) {
          onOrbitRef.current?.(dx, dy);
          return;
        }
      }

      const id = pickTip(e.clientX, e.clientY);
      if (!id) {
        setHighlight(null);
        setHover(null);
        return;
      }
      setHighlight(id);
      const entry = tipById.get(id);
      if (!entry) return;
      const p = projectTip(entry.tip);
      const label = id === "hub" ? "Isométrica · perspectiva" : TIP_META[id].label;
      setHover({ id, label, x: p.x, y: p.y });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!pressActive) return;
      const wasOrbiting = orbiting;
      const tip = pressTip;
      pressActive = false;
      orbiting = false;
      pressTip = null;
      clearHoldTimer();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!wasOrbiting && tip) applyPreset(tip);
    };

    const onPointerLeave = () => {
      if (pressActive) return;
      setHighlight(null);
      setHover(null);
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    return () => {
      cancelAnimationFrame(raf);
      clearHoldTimer();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      disposeGeoms.forEach((g) => g.dispose());
      disposeMats.forEach((m) => m.dispose());
      root.clear();
      renderer.dispose();
    };
  }, [visible, requestCameraPreset]);

  if (!visible) return null;

  return (
    <div
      ref={hostRef}
      className="view-gizmo"
      aria-label="Orientación de vista 3D"
      title="Ejes ±X ±Y ±Z = vistas orto · centro = iso · mantener/arrastrar = orbitar"
    >
      <canvas ref={canvasRef} className="view-gizmo__canvas" width={104} height={104} />
      {hover && (
        <span className="view-gizmo__label" style={{ left: hover.x, top: hover.y }}>
          {hover.label}
        </span>
      )}
    </div>
  );
}
