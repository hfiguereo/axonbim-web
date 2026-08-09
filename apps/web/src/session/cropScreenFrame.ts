/**
 * Camera / free-3D screen matte + corner grips (ADR 0016 C3).
 *
 * Screen chrome only: starts at inset 8%; grips resize the CSS rect.
 * Does NOT mutate Camera.crop / ViewCrop / GPU clip — those stay as set in plan.
 * Plan keeps world grips + pickGround for real crop extent.
 */
import type { CropCorner, ViewCrop } from "@axonbim/model";
import { normalizeViewCrop, viewCropCorners } from "@axonbim/model";

export type HostRect = { left: number; top: number; width: number; height: number };

export type ScreenCropFrame = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** Frame-local grip positions bound to world CropCorner (0=SW…3=NW). */
  corners: Array<{ corner: CropCorner; left: number; top: number }>;
};

export type ClientProject = (
  x: number,
  y: number,
  z: number,
) => { x: number; y: number; behind: boolean } | null;

/** Matches CSS `.viewport__crop-frame { inset: 8% }` — view-limit chrome. */
export const CAMERA_CROP_FRAME_INSET = 0.08;

export function oppositeCropCorner(corner: CropCorner): CropCorner {
  return ((corner + 2) % 4) as CropCorner;
}

function projectedCornersLocal(
  crop: ViewCrop,
  z: number,
  project: ClientProject,
  host: HostRect,
  frameLeft: number,
  frameTop: number,
): Array<{ corner: CropCorner; left: number; top: number }> {
  const out: Array<{ corner: CropCorner; left: number; top: number }> = [];
  for (const c of viewCropCorners(crop, z)) {
    const p = project(c.x, c.y, c.z);
    if (!p || p.behind) continue;
    out.push({
      corner: c.corner,
      left: p.x - host.left - frameLeft,
      top: p.y - host.top - frameTop,
    });
  }
  return out;
}

function nearestCorner(
  at: { left: number; top: number },
  pts: Array<{ corner: CropCorner; left: number; top: number }>,
  exclude: Set<CropCorner>,
): CropCorner {
  let best: CropCorner = 0;
  let bestD = Infinity;
  for (const p of pts) {
    if (exclude.has(p.corner)) continue;
    const d = (p.left - at.left) ** 2 + (p.top - at.top) ** 2;
    if (d < bestD) {
      bestD = d;
      best = p.corner;
    }
  }
  if (!Number.isFinite(bestD) || bestD === Infinity) {
    for (const c of [0, 1, 2, 3] as CropCorner[]) {
      if (!exclude.has(c)) return c;
    }
  }
  return best;
}

/**
 * TL/TR/BR/BL grips; screen diagonals map to world opposites (0↔2, 1↔3).
 */
export function rectCornerGrips(
  projectedLocal: Array<{ corner: CropCorner; left: number; top: number }>,
  width: number,
  height: number,
): ScreenCropFrame["corners"] {
  const tl = { left: 0, top: 0 };
  const tr = { left: width, top: 0 };
  const br = { left: width, top: height };
  const bl = { left: 0, top: height };

  if (projectedLocal.length === 0) {
    return [
      { corner: 3, ...tl },
      { corner: 2, ...tr },
      { corner: 1, ...br },
      { corner: 0, ...bl },
    ];
  }

  const used = new Set<CropCorner>();
  const tlC = nearestCorner(tl, projectedLocal, used);
  used.add(tlC);
  used.add(oppositeCropCorner(tlC));
  const trC = nearestCorner(tr, projectedLocal, used);

  return [
    { corner: tlC, ...tl },
    { corner: trC, ...tr },
    { corner: oppositeCropCorner(tlC), ...br },
    { corner: oppositeCropCorner(trC), ...bl },
  ];
}

/**
 * Fixed inset matte (view chrome) + grips mapped to world crop corners.
 * Projection is only used to bind each CSS corner to a CropCorner id.
 */
export function buildCameraCropScreenFrame(
  crop: ViewCrop,
  z: number,
  project: ClientProject,
  host: HostRect,
  insetFrac = CAMERA_CROP_FRAME_INSET,
): ScreenCropFrame | null {
  if (!crop.enabled) return null;
  if (host.width < 8 || host.height < 8) return null;

  const left = host.width * insetFrac;
  const top = host.height * insetFrac;
  const width = host.width * (1 - 2 * insetFrac);
  const height = host.height * (1 - 2 * insetFrac);
  if (width < 8 || height < 8) return null;

  const projected = projectedCornersLocal(crop, z, project, host, left, top);
  return {
    left,
    top,
    width,
    height,
    corners: rectCornerGrips(projected, width, height),
  };
}

/**
 * Project world crop → host-local AABB (debug / tests).
 * Not used for the camera matte — see `buildCameraCropScreenFrame`.
 */
export function projectCropToHostRect(
  crop: ViewCrop,
  z: number,
  project: ClientProject,
  host: HostRect,
): ScreenCropFrame | null {
  if (!crop.enabled) return null;

  const projected: Array<{ corner: CropCorner; left: number; top: number }> = [];
  for (const c of viewCropCorners(crop, z)) {
    const p = project(c.x, c.y, c.z);
    if (!p || p.behind) continue;
    projected.push({
      corner: c.corner,
      left: p.x - host.left,
      top: p.y - host.top,
    });
  }
  if (projected.length < 2) return null;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const c of projected) {
    minX = Math.min(minX, c.left);
    maxX = Math.max(maxX, c.left);
    minY = Math.min(minY, c.top);
    maxY = Math.max(maxY, c.top);
  }

  const width = Math.max(8, maxX - minX);
  const height = Math.max(8, maxY - minY);
  const local = projected.map((c) => ({
    corner: c.corner,
    left: c.left - minX,
    top: c.top - minY,
  }));

  return {
    left: minX,
    top: minY,
    width,
    height,
    corners: rectCornerGrips(local, width, height),
  };
}

/** Keep world-corner bindings; place grips on the new CSS rect corners. */
export function withScreenFrameRect(
  prev: ScreenCropFrame,
  rect: { left: number; top: number; width: number; height: number },
): ScreenCropFrame {
  const w0 = Math.max(1, prev.width);
  const h0 = Math.max(1, prev.height);
  const pick = (atLeft: number, atTop: number): CropCorner => {
    let best: CropCorner = prev.corners[0]?.corner ?? 0;
    let bestD = Infinity;
    for (const c of prev.corners) {
      const d = (c.left - atLeft * w0) ** 2 + (c.top - atTop * h0) ** 2;
      if (d < bestD) {
        bestD = d;
        best = c.corner;
      }
    }
    return best;
  };
  const width = Math.max(24, rect.width);
  const height = Math.max(24, rect.height);
  return {
    left: rect.left,
    top: rect.top,
    width,
    height,
    corners: [
      { corner: pick(0, 0), left: 0, top: 0 },
      { corner: pick(1, 0), left: width, top: 0 },
      { corner: pick(1, 1), left: width, top: height },
      { corner: pick(0, 1), left: 0, top: height },
    ],
  };
}

/** Live CSS frame while dragging a corner (opposite screen corner fixed). */
export function screenFrameFromCornerDrag(
  prev: ScreenCropFrame,
  host: HostRect,
  oppClient: { x: number; y: number },
  curClient: { x: number; y: number },
): ScreenCropFrame {
  const left = Math.min(curClient.x, oppClient.x) - host.left;
  const top = Math.min(curClient.y, oppClient.y) - host.top;
  const width = Math.abs(curClient.x - oppClient.x);
  const height = Math.abs(curClient.y - oppClient.y);
  return withScreenFrameRect(prev, { left, top, width, height });
}

/** Rescale screen chrome when world crop W/D changes outside a grip drag. */
export function scaleScreenFrameToWorldSize(
  frame: ScreenCropFrame,
  host: HostRect,
  prevWorld: { w: number; d: number },
  nextWorld: { w: number; d: number },
): ScreenCropFrame {
  if (prevWorld.w < 1e-6 || prevWorld.d < 1e-6) return frame;
  const sx = nextWorld.w / prevWorld.w;
  const sy = nextWorld.d / prevWorld.d;
  if (!Number.isFinite(sx) || !Number.isFinite(sy)) return frame;
  if (Math.abs(sx - 1) < 1e-6 && Math.abs(sy - 1) < 1e-6) return frame;

  const cx = frame.left + frame.width / 2;
  const cy = frame.top + frame.height / 2;
  let width = Math.max(24, frame.width * sx);
  let height = Math.max(24, frame.height * sy);
  width = Math.min(width, host.width * 0.98);
  height = Math.min(height, host.height * 0.98);
  let left = cx - width / 2;
  let top = cy - height / 2;
  left = Math.max(0, Math.min(left, host.width - width));
  top = Math.max(0, Math.min(top, host.height - height));
  return withScreenFrameRect(frame, { left, top, width, height });
}

export function viewCropWorldSize(crop: ViewCrop): { w: number; d: number } {
  return { w: crop.maxX - crop.minX, d: crop.maxY - crop.minY };
}

/**
 * Resize world crop from a CSS-rect corner drag.
 * Screen |Δx| → world width; screen |Δy| → world depth; opposite world corner fixed.
 */
export function resizeCropFromScreenRectCorner(input: {
  baseline: ViewCrop;
  corner: CropCorner;
  startClient: { x: number; y: number };
  curClient: { x: number; y: number };
  oppClient: { x: number; y: number };
}): ViewCrop {
  const { baseline, corner, startClient, curClient, oppClient } = input;
  const startW = Math.abs(startClient.x - oppClient.x);
  const startH = Math.abs(startClient.y - oppClient.y);
  if (startW < 1 || startH < 1) return baseline;

  const scaleX = Math.abs(curClient.x - oppClient.x) / startW;
  const scaleY = Math.abs(curClient.y - oppClient.y) / startH;
  if (!Number.isFinite(scaleX) || !Number.isFinite(scaleY)) return baseline;

  const w0 = baseline.maxX - baseline.minX;
  const d0 = baseline.maxY - baseline.minY;
  const newW = Math.max(0.5, w0 * scaleX);
  const newD = Math.max(0.5, d0 * scaleY);

  const fixed = viewCropCorners(baseline, 0).find(
    (c) => c.corner === oppositeCropCorner(corner),
  );
  if (!fixed) return baseline;

  switch (corner) {
    case 0: // SW — fixed NE
      return normalizeViewCrop({
        ...baseline,
        minX: fixed.x - newW,
        maxX: fixed.x,
        minY: fixed.y - newD,
        maxY: fixed.y,
      });
    case 1: // SE — fixed NW
      return normalizeViewCrop({
        ...baseline,
        minX: fixed.x,
        maxX: fixed.x + newW,
        minY: fixed.y - newD,
        maxY: fixed.y,
      });
    case 2: // NE — fixed SW
      return normalizeViewCrop({
        ...baseline,
        minX: fixed.x,
        maxX: fixed.x + newW,
        minY: fixed.y,
        maxY: fixed.y + newD,
      });
    case 3: // NW — fixed SE
      return normalizeViewCrop({
        ...baseline,
        minX: fixed.x - newW,
        maxX: fixed.x,
        minY: fixed.y,
        maxY: fixed.y + newD,
      });
  }
}
