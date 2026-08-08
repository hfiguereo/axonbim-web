import type { ViewCrop } from "@axonbim/model";
import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Plane,
  PlaneGeometry,
  type Material,
  type WebGLRenderer,
} from "three";

/** Plane equations [nx, ny, nz, constant] matching Three.js Plane.setComponents. */
export type ClipPlaneEquation = readonly [number, number, number, number];

const PLAN_MASK_BIG = 400;
const PLAN_MASK_Z = 12;

/** Pure AABB → clip plane equations (ADR 0016). */
export function cropToClipPlaneEquations(crop: ViewCrop): ClipPlaneEquation[] {
  const planes: ClipPlaneEquation[] = [
    [1, 0, 0, -crop.minX],
    [-1, 0, 0, crop.maxX],
    [0, 1, 0, -crop.minY],
    [0, -1, 0, crop.maxY],
  ];
  if (crop.minZ !== undefined && crop.maxZ !== undefined) {
    planes.push([0, 0, 1, -crop.minZ], [0, 0, -1, crop.maxZ]);
  }
  return planes;
}

export function writeCropPlanesToPool(crop: ViewCrop, pool: Plane[]): Plane[] {
  const eqs = cropToClipPlaneEquations(crop);
  for (let i = 0; i < eqs.length; i++) {
    const [nx, ny, nz, c] = eqs[i]!;
    pool[i]!.setComponents(nx, ny, nz, c);
  }
  return pool.slice(0, eqs.length);
}

export function clearGroupMeshes(group: Group): void {
  while (group.children.length) {
    const child = group.children[0]!;
    group.remove(child);
    if (child instanceof Mesh) child.geometry.dispose();
  }
}

/**
 * Solid masks outside plan crop AABB (reliable hide in top view).
 * No-op / hide when crop disabled or not in plan mode.
 */
export function rebuildPlanCropMask(
  group: Group,
  material: MeshBasicMaterial,
  crop: ViewCrop | null,
  isPlan: boolean,
): void {
  clearGroupMeshes(group);
  if (!crop?.enabled || !isPlan) {
    group.visible = false;
    return;
  }
  group.visible = true;
  const { minX, minY, maxX, maxY } = crop;
  const big = PLAN_MASK_BIG;
  const addBand = (cx: number, cy: number, w: number, d: number) => {
    if (w < 1e-4 || d < 1e-4) return;
    const mesh = new Mesh(new PlaneGeometry(w, d), material);
    mesh.position.set(cx, cy, PLAN_MASK_Z);
    mesh.raycast = () => {};
    group.add(mesh);
  };
  addBand((-big + minX) / 2, 0, minX + big, 2 * big);
  addBand((maxX + big) / 2, 0, big - maxX, 2 * big);
  addBand((minX + maxX) / 2, (-big + minY) / 2, maxX - minX, minY + big);
  addBand((minX + maxX) / 2, (maxY + big) / 2, maxX - minX, big - maxY);
}

export function createPlanCropMaskMaterial(backgroundHex: number): MeshBasicMaterial {
  return new MeshBasicMaterial({
    color: backgroundHex,
    depthTest: true,
    depthWrite: true,
    side: DoubleSide,
  });
}

export function createClipPlanePool(): Plane[] {
  return [new Plane(), new Plane(), new Plane(), new Plane(), new Plane(), new Plane()];
}

type ClipMaterial = Material & {
  clippingPlanes: Plane[] | null;
  clipIntersection: boolean;
  needsUpdate: boolean;
};

/** Apply GPU clipping planes + plan mask for the current crop. */
export function applyViewCropClipping(opts: {
  crop: ViewCrop | null;
  renderer: WebGLRenderer;
  materials: ClipMaterial[];
  planePool: Plane[];
  maskGroup: Group;
  maskMaterial: MeshBasicMaterial;
  isPlan: boolean;
}): void {
  const { crop, renderer, materials, planePool, maskGroup, maskMaterial, isPlan } = opts;
  renderer.localClippingEnabled = true;
  if (!crop?.enabled) {
    for (const mat of materials) {
      mat.clippingPlanes = [];
      mat.clipIntersection = false;
      mat.needsUpdate = true;
    }
    rebuildPlanCropMask(maskGroup, maskMaterial, null, isPlan);
    return;
  }
  const planes = writeCropPlanesToPool(crop, planePool);
  for (const mat of materials) {
    mat.clippingPlanes = planes;
    mat.clipIntersection = false;
    mat.needsUpdate = true;
  }
  rebuildPlanCropMask(maskGroup, maskMaterial, crop, isPlan);
}
