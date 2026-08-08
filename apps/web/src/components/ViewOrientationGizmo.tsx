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

type AxisId = "x" | "y" | "z";

const AXIS_META: Record<
  AxisId,
  { label: string; color: number; dir: [number, number, number]; preset: CameraPreset }
> = {
  x: { label: "X · derecha", color: 0xe05a5a, dir: [1, 0, 0], preset: "right" },
  y: { label: "Y · frente", color: 0x5bb85b, dir: [0, 1, 0], preset: "front" },
  z: { label: "Z · arriba", color: 0x5a8ae0, dir: [0, 0, 1], preset: "top" },
};

/**
 * Gizmo 3D (estilo Blender) — clics aplican presets reales a la cámara perspectiva.
 */
export function ViewOrientationGizmo({ visible }: { visible: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestCameraPreset = useSessionStore((s) => s.requestCameraPreset);
  const [hover, setHover] = useState<{
    id: AxisId | "hub";
    label: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;

    const size = 96;
    const renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new Scene();
    const camera = new OrthographicCamera(-1.35, 1.35, 1.35, -1.35, 0.1, 20);
    camera.position.set(2.2, -2.4, 2.1);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    scene.add(new AmbientLight(0xffffff, 0.75));
    const sun = new DirectionalLight(0xffffff, 0.9);
    sun.position.set(3, -2, 4);
    scene.add(sun);

    const root = new Group();
    scene.add(root);

    const tipMeshes: Mesh[] = [];
    const shaftMats: MeshLambertMaterial[] = [];
    const tipMats: MeshLambertMaterial[] = [];

    const makeAxis = (id: AxisId) => {
      const meta = AXIS_META[id];
      const shaftMat = new MeshLambertMaterial({ color: meta.color });
      const tipMat = new MeshLambertMaterial({ color: meta.color });
      shaftMats.push(shaftMat);
      tipMats.push(tipMat);

      const shaft = new Mesh(new CylinderGeometry(0.045, 0.045, 0.72, 12), shaftMat);
      shaft.position.set(
        meta.dir[0] * 0.36,
        meta.dir[1] * 0.36,
        meta.dir[2] * 0.36,
      );
      if (id === "x") shaft.rotation.z = -Math.PI / 2;
      else if (id === "z") shaft.rotation.x = Math.PI / 2;

      const tip = new Mesh(new SphereGeometry(0.12, 16, 12), tipMat);
      tip.position.set(
        meta.dir[0] * 0.78,
        meta.dir[1] * 0.78,
        meta.dir[2] * 0.78,
      );
      tip.userData.axisId = id;
      tipMeshes.push(tip);

      const g = new Group();
      g.add(shaft);
      g.add(tip);
      root.add(g);
      return { tip, tipMat };
    };

    const axes = {
      x: makeAxis("x"),
      y: makeAxis("y"),
      z: makeAxis("z"),
    };

    const hubMat = new MeshLambertMaterial({ color: 0xc8cdd2 });
    const hub = new Mesh(new SphereGeometry(0.1, 16, 12), hubMat);
    hub.userData.axisId = "hub";
    root.add(hub);
    tipMeshes.push(hub);

    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let highlighted: AxisId | "hub" | null = null;
    let raf = 0;
    let t0 = performance.now();

    const setHighlight = (id: AxisId | "hub" | null) => {
      highlighted = id;
      (Object.keys(axes) as AxisId[]).forEach((k) => {
        const on = k === id;
        axes[k].tip.scale.setScalar(on ? 1.35 : 1);
        axes[k].tipMat.emissive = new Color(on ? 0x333333 : 0x000000);
      });
      hub.scale.setScalar(id === "hub" ? 1.35 : 1);
      hubMat.emissive = new Color(id === "hub" ? 0x333333 : 0x000000);
    };

    const projectTip = (obj: Mesh) => {
      const v = new Vector3().copy(obj.getWorldPosition(new Vector3()));
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * size,
        y: (-v.y * 0.5 + 0.5) * size,
      };
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const elapsed = (now - t0) / 1000;
      root.rotation.z = Math.sin(elapsed * 0.35) * 0.22;
      root.rotation.x = Math.cos(elapsed * 0.28) * 0.1;
      if (highlighted && highlighted !== "hub") {
        const pulse = 1.28 + Math.sin(elapsed * 6) * 0.08;
        axes[highlighted].tip.scale.setScalar(pulse);
      }
      renderer.render(scene, camera);
    };
    render(performance.now());

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(tipMeshes, false);
      const id = hits[0]?.object.userData.axisId as AxisId | "hub" | undefined;
      if (!id) {
        setHighlight(null);
        setHover(null);
        return;
      }
      setHighlight(id);
      const p = projectTip(hits[0]!.object as Mesh);
      const label = id === "hub" ? "Isométrica" : AXIS_META[id].label;
      setHover({ id, label, x: p.x, y: p.y });
    };

    const onLeave = () => {
      setHighlight(null);
      setHover(null);
    };

    const onClick = () => {
      if (!highlighted) return;
      if (highlighted === "hub") {
        requestCameraPreset("iso");
        return;
      }
      requestCameraPreset(AXIS_META[highlighted].preset);
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("click", onClick);
      tipMeshes.forEach((m) => {
        if (m !== hub) m.geometry.dispose();
      });
      hub.geometry.dispose();
      hubMat.dispose();
      shaftMats.forEach((m) => m.dispose());
      tipMats.forEach((m) => m.dispose());
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
      title="Z superior · Y frontal · X derecha · centro isométrica"
    >
      <canvas ref={canvasRef} className="view-gizmo__canvas" width={96} height={96} />
      {hover && (
        <span
          className="view-gizmo__label"
          style={{ left: hover.x, top: hover.y }}
        >
          {hover.label}
        </span>
      )}
    </div>
  );
}
