import type { PlanFlipControl } from "@axonbim/geometry";
import type { Wall } from "@axonbim/model";
import {
  wallFaceFromWorldNormal,
  wallFaceTowardPoint,
  wallMaxHeightOf,
} from "@axonbim/model";
import {
  Group,
  LineSegments,
  Mesh,
  Plane,
  Vector3,
} from "three";
import {
  CROP_FRAME_PROXIMITY_PX,
  CROP_GRIP_PROXIMITY_PX,
  ENTITY_PROXIMITY_PX,
  FLIP_CONTROL_PROXIMITY_PX,
} from "./pickTolerance.js";
import type { ViewportContext } from "./viewportContext.js";
import {
  CAMERA_ID,
  CORNER,
  CROP_FRAME,
  CROP_GRIP,
  DOOR_ID,
  FLIP_CONTROL,
  isValidCropCorner,
  parseFlipPickUserData,
  WALL_ID,
  WINDOW_ID,
} from "./viewportUserData.js";

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

/** Ephemeral pick for vertical wall profile (ADR 0018). Not SoT. */
export type WallHit = {
  wallId: string;
  face: "front" | "back";
  point: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
};

export type WorkplanePickSpec = {
  origin: { x: number; y: number; z: number };
  normal: { x: number; y: number; z: number };
};

export type ViewportPicking = {
  pickGround: (
    clientX: number,
    clientY: number,
    elevation?: number,
  ) => { x: number; y: number; z: number } | null;
  /** Ray ∩ arbitrary workplane (WP-v2). */
  pickWorkplane: (
    clientX: number,
    clientY: number,
    plane: WorkplanePickSpec,
  ) => { x: number; y: number; z: number } | null;
  pickWallId: (clientX: number, clientY: number) => string | null;
  /**
   * Ray ∩ wall mesh → WallHit (face/point/normal). Requires live walls for face map.
   * Prefer this over pickWallId when entering vertical profile edit.
   */
  pickWallHit: (
    clientX: number,
    clientY: number,
    walls: readonly Wall[],
  ) => WallHit | null;
  pickDoorId: (clientX: number, clientY: number) => string | null;
  pickWindowId: (clientX: number, clientY: number) => string | null;
  pickCameraId: (clientX: number, clientY: number) => string | null;
  pickFlipControl: (clientX: number, clientY: number) => FlipPick | null;
  pickCropGrip: (clientX: number, clientY: number) => CropGripPick | null;
  pickCropFrame: (clientX: number, clientY: number) => { cameraId: string } | null;
};

export function createViewportPicking(ctx: ViewportContext): ViewportPicking {
  const {
    wallsGroup,
    doorsGroup,
    windowsGroup,
    camerasGroup,
    planDoorsGroup,
    flipControlsGroup,
    cropGroup,
  } = ctx.sg;

  const pickEntityId = (
    clientX: number,
    clientY: number,
    group: Group,
    key: string,
  ): string | null => {
    ctx.applyPickThreshold();
    ctx.toNdc(clientX, clientY);
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const hits = ctx.raycaster.intersectObjects(group.children, true);
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
          const scr = ctx.clientFromWorld(c.x, c.y, c.z);
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
      const scr = ctx.clientFromWorld(wp.x, wp.y, wp.z);
      if (scr.behind) continue;
      const d = Math.hypot(scr.x - clientX, scr.y - clientY);
      if (d < bestD) {
        bestD = d;
        bestId = id;
      }
    }
    return bestId;
  };

  const pickGround = (
    clientX: number,
    clientY: number,
    elevation = 0,
  ): { x: number; y: number; z: number } | null => {
    ctx.applyPickThreshold();
    ctx.toNdc(clientX, clientY);
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    ctx.groundPlane.constant = -elevation;
    const ok = ctx.raycaster.ray.intersectPlane(ctx.groundPlane, ctx.hit);
    if (!ok) return null;
    return { x: ctx.hit.x, y: ctx.hit.y, z: elevation };
  };

  const pickWorkplane = (
    clientX: number,
    clientY: number,
    plane: WorkplanePickSpec,
  ): { x: number; y: number; z: number } | null => {
    ctx.applyPickThreshold();
    ctx.toNdc(clientX, clientY);
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const n = new Vector3(plane.normal.x, plane.normal.y, plane.normal.z);
    if (n.lengthSq() < 1e-12) return null;
    n.normalize();
    // three.js Plane: normal · x + constant = 0 → constant = -normal · origin
    const constant = -(
      n.x * plane.origin.x +
      n.y * plane.origin.y +
      n.z * plane.origin.z
    );
    const pl = new Plane(n, constant);
    const ok = ctx.raycaster.ray.intersectPlane(pl, ctx.hit);
    if (!ok) return null;
    return { x: ctx.hit.x, y: ctx.hit.y, z: ctx.hit.z };
  };

  const pickWallId = (clientX: number, clientY: number) =>
    pickEntityId(clientX, clientY, wallsGroup, WALL_ID);

  const pickWallHit = (
    clientX: number,
    clientY: number,
    walls: readonly Wall[],
  ): WallHit | null => {
    ctx.applyPickThreshold();
    ctx.toNdc(clientX, clientY);
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const hits = ctx.raycaster.intersectObjects(wallsGroup.children, true);
    for (const h of hits) {
      let o: typeof h.object | null = h.object;
      let wallId: string | undefined;
      while (o) {
        const id = o.userData?.[WALL_ID];
        if (typeof id === "string") {
          wallId = id;
          break;
        }
        o = o.parent as typeof o;
        if (o === wallsGroup) break;
      }
      if (!wallId) continue;
      const wall = walls.find((w) => w.id === wallId);
      if (!wall) continue;
      const point = { x: h.point.x, y: h.point.y, z: h.point.z };
      const nWorld = h.face
        ? h.face.normal
            .clone()
            .transformDirection(h.object.matrixWorld)
            .normalize()
        : new Vector3(0, 0, 1);
      const normal = { x: nWorld.x, y: nWorld.y, z: nWorld.z };
      const face =
        Math.hypot(normal.x, normal.y) > 1e-6
          ? wallFaceFromWorldNormal(wall, normal)
          : wallFaceTowardPoint(wall, point);
      return { wallId, face, point, normal };
    }
    // Proximity fallback: id + face toward a point near the wall mid on the ray.
    const wallId = pickWallId(clientX, clientY);
    if (!wallId) return null;
    const wall = walls.find((w) => w.id === wallId);
    if (!wall) return null;
    const mid = {
      x: (wall.p1.x + wall.p2.x) / 2,
      y: (wall.p1.y + wall.p2.y) / 2,
      z: (wall.p1.z + wall.p2.z) / 2 + wallMaxHeightOf(wall) * 0.5,
    };
    const face = wallFaceTowardPoint(wall, mid);
    const half = wall.thickness * 0.5;
    const dx = wall.p2.x - wall.p1.x;
    const dy = wall.p2.y - wall.p1.y;
    const len = Math.hypot(dx, dy) || 1;
    let nx = -dy / len;
    let ny = dx / len;
    if (face === "back") {
      nx = -nx;
      ny = -ny;
    }
    return {
      wallId,
      face,
      point: {
        x: mid.x + nx * half,
        y: mid.y + ny * half,
        z: mid.z,
      },
      normal: { x: nx, y: ny, z: 0 },
    };
  };

  const pickDoorId = (clientX: number, clientY: number) => {
    const fromSolid = pickEntityId(clientX, clientY, doorsGroup, DOOR_ID);
    if (fromSolid) return fromSolid;
    if (ctx.mode === "plan") {
      return pickEntityId(clientX, clientY, planDoorsGroup, DOOR_ID);
    }
    return null;
  };

  const pickWindowId = (clientX: number, clientY: number) => {
    const fromSolid = pickEntityId(clientX, clientY, windowsGroup, WINDOW_ID);
    if (fromSolid) return fromSolid;
    if (ctx.mode === "plan") {
      return pickEntityId(clientX, clientY, planDoorsGroup, WINDOW_ID);
    }
    return null;
  };

  const pickCameraId = (clientX: number, clientY: number) => {
    if (ctx.mode !== "plan") return null;
    return pickEntityId(clientX, clientY, camerasGroup, CAMERA_ID);
  };

  const pickFlipControl = (clientX: number, clientY: number): FlipPick | null => {
    if (ctx.mode !== "plan" || !flipControlsGroup.visible) return null;
    ctx.applyPickThreshold();
    ctx.toNdc(clientX, clientY);
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const hits = ctx.raycaster.intersectObjects(flipControlsGroup.children, false);
    let obj: (typeof flipControlsGroup.children)[number] | undefined =
      hits[0]?.object;
    if (!obj?.userData?.[FLIP_CONTROL]) {
      // Proximity fallback for tiny grips when zoomed out
      const maxPx = FLIP_CONTROL_PROXIMITY_PX;
      let bestD = maxPx;
      let best: (typeof flipControlsGroup.children)[number] | undefined;
      for (const child of flipControlsGroup.children) {
        if (!child.userData?.[FLIP_CONTROL]) continue;
        const wp = new Vector3();
        child.getWorldPosition(wp);
        const scr = ctx.clientFromWorld(wp.x, wp.y, wp.z);
        if (scr.behind) continue;
        const d = Math.hypot(scr.x - clientX, scr.y - clientY);
        if (d < bestD) {
          bestD = d;
          best = child;
        }
      }
      obj = best;
    }
    if (!obj?.userData?.[FLIP_CONTROL]) return null;
    return parseFlipPickUserData(obj.userData);
  };

  const pickCropGrip = (clientX: number, clientY: number): CropGripPick | null => {
    if (ctx.mode !== "plan" || !cropGroup.visible) return null;
    ctx.toNdc(clientX, clientY);
    ctx.applyPickThreshold();
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const hits = ctx.raycaster.intersectObjects(cropGroup.children, false);
    for (const hit of hits) {
      const obj = hit.object;
      if (!obj.userData?.[CROP_GRIP]) continue;
      const corner = obj.userData[CORNER];
      if (!isValidCropCorner(corner)) continue;
      const cameraId =
        typeof obj.userData[CAMERA_ID] === "string" ? obj.userData[CAMERA_ID] : null;
      return { corner, cameraId };
    }
    // Proximity fallback
    const maxPx = CROP_GRIP_PROXIMITY_PX;
    let best: CropGripPick | null = null;
    let bestD = maxPx;
    for (const child of cropGroup.children) {
      if (!child.userData?.[CROP_GRIP]) continue;
      const corner = child.userData[CORNER];
      if (!isValidCropCorner(corner)) continue;
      const scr = ctx.clientFromWorld(child.position.x, child.position.y, child.position.z);
      if (scr.behind) continue;
      const d = Math.hypot(scr.x - clientX, scr.y - clientY);
      if (d < bestD) {
        bestD = d;
        best = {
          corner,
          cameraId:
            typeof child.userData[CAMERA_ID] === "string"
              ? child.userData[CAMERA_ID]
              : null,
        };
      }
    }
    return best;
  };

  const pickCropFrame = (clientX: number, clientY: number): { cameraId: string } | null => {
    if (ctx.mode !== "plan" || !cropGroup.visible) return null;
    ctx.toNdc(clientX, clientY);
    ctx.applyPickThreshold();
    ctx.raycaster.setFromCamera(ctx.ndc, ctx.activeCamera());
    const hits = ctx.raycaster.intersectObjects(cropGroup.children, false);
    for (const hit of hits) {
      const obj = hit.object;
      if (!obj.userData?.[CROP_FRAME]) continue;
      if (typeof obj.userData[CAMERA_ID] !== "string") continue;
      return { cameraId: obj.userData[CAMERA_ID] };
    }
    // Screen-proximity to frame corners/edges (thin lines)
    const maxPx = CROP_FRAME_PROXIMITY_PX;
    let bestId: string | null = null;
    let bestD = maxPx;
    for (const child of cropGroup.children) {
      if (!child.userData?.[CROP_FRAME]) continue;
      if (typeof child.userData[CAMERA_ID] !== "string") continue;
      if (!(child instanceof LineSegments)) continue;
      const pos = child.geometry.getAttribute("position");
      if (!pos) continue;
      for (let i = 0; i < pos.count; i++) {
        const scr = ctx.clientFromWorld(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (scr.behind) continue;
        const d = Math.hypot(scr.x - clientX, scr.y - clientY);
        if (d < bestD) {
          bestD = d;
          bestId = child.userData[CAMERA_ID];
        }
      }
    }
    return bestId ? { cameraId: bestId } : null;
  };

  return {
    pickGround,
    pickWorkplane,
    pickWallId,
    pickWallHit,
    pickDoorId,
    pickWindowId,
    pickCameraId,
    pickFlipControl,
    pickCropGrip,
    pickCropFrame,
  };
}
