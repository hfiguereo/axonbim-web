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
import { useSessionStore } from "../sessionStore";

type AxisId = "x" | "y" | "z";

const AXIS_META: Record<
  AxisId,
  { label: string; color: number; dir: [number, number, number] }
> = {
  x: { label: "X · derecha", color: 0xe05a5a, dir: [1, 0, 0] },
  y: { label: "Y · frente", color: 0x5bb85b, dir: [0, 1, 0] },
  z: { label: "Z · arriba", color: 0x5a8ae0, dir: [0, 0, 1] },
};

/**
 * Gizmo 3D animado (estilo Blender) — maqueta.
 * Etiqueta de texto solo al resaltar un extremo de eje.
 * Orientación real de cámara = etapa futura.
 */
export function ViewOrientationGizmo({ visible }: { visible: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const setStatus = useSessionStore((s) => s.setStatus);
  const [hover, setHover] = useState<{
    id: AxisId;
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
      // Cylinder default along Y — align to axis
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

    const hub = new Mesh(
      new SphereGeometry(0.1, 16, 12),
      new MeshLambertMaterial({ color: 0xc8cdd2 }),
    );
    root.add(hub);

    const raycaster = new Raycaster();
    const ndc = new Vector2();
    let highlighted: AxisId | null = null;
    let raf = 0;
    let t0 = performance.now();

    const setHighlight = (id: AxisId | null) => {
      highlighted = id;
      (Object.keys(axes) as AxisId[]).forEach((k) => {
        const on = k === id;
        axes[k].tip.scale.setScalar(on ? 1.35 : 1);
        axes[k].tipMat.emissive = new Color(on ? 0x333333 : 0x000000);
      });
    };

    const projectTip = (id: AxisId) => {
      const v = new Vector3().copy(axes[id].tip.getWorldPosition(new Vector3()));
      v.project(camera);
      return {
        x: (v.x * 0.5 + 0.5) * size,
        y: (-v.y * 0.5 + 0.5) * size,
      };
    };

    const render = (now: number) => {
      raf = requestAnimationFrame(render);
      const elapsed = (now - t0) / 1000;
      // Idle spin — slow orbit feel
      root.rotation.z = Math.sin(elapsed * 0.35) * 0.22;
      root.rotation.x = Math.cos(elapsed * 0.28) * 0.1;
      // Soft pulse on highlighted tip
      if (highlighted) {
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
      const id = hits[0]?.object.userData.axisId as AxisId | undefined;
      if (!id) {
        setHighlight(null);
        setHover(null);
        return;
      }
      setHighlight(id);
      const p = projectTip(id);
      setHover({ id, label: AXIS_META[id].label, x: p.x, y: p.y });
    };

    const onLeave = () => {
      setHighlight(null);
      setHover(null);
    };

    const onClick = () => {
      if (!highlighted) return;
      setStatus(
        `Gizmo ${AXIS_META[highlighted].label}: maqueta — orientación real en etapa futura`,
      );
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
        m.geometry.dispose();
      });
      shaftMats.forEach((m) => m.dispose());
      tipMats.forEach((m) => m.dispose());
      hub.geometry.dispose();
      (hub.material as MeshLambertMaterial).dispose();
      root.clear();
      renderer.dispose();
    };
  }, [visible, setStatus]);

  if (!visible) return null;

  return (
    <div
      ref={hostRef}
      className="view-gizmo"
      aria-label="Orientación de vista 3D (maqueta)"
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
