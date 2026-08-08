import type { PlanFlipControl } from "@axonbim/geometry";
import {
  Group,
  LineSegments,
  Mesh,
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

export type ViewportPicking = {
  pickGround: (
    clientX: number,
    clientY: number,
    elevation?: number,
  ) => { x: number; y: number; z: number } | null;
  pickWallId: (clientX: number, clientY: number) => string | null;
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

  const pickWallId = (clientX: number, clientY: number) =>
    pickEntityId(clientX, clientY, wallsGroup, WALL_ID);

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
    pickWallId,
    pickDoorId,
    pickWindowId,
    pickCameraId,
    pickFlipControl,
    pickCropGrip,
    pickCropFrame,
  };
}
