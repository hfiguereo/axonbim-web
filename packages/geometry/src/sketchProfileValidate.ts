/**
 * Validate provisional sketch profile before Terminar replaces hosts.
 * Contrato: docs/architecture/sketch-result-outline.md (SK-replace).
 */

import type { Workplane } from "@axonbim/model";
import { MIN_THICKNESS, MIN_WALL_LENGTH, type Vec3 } from "@axonbim/shared";
import {
  faceLineToWallAxis,
  insetRingToAxes,
  invertStoreyFootprint,
  invertVerticalFaceOutline,
  isWallBoxFootprint,
} from "./wallResultOutline.js";

/** Duck-type compatible with @axonbim/tools SketchProfile. */
export type ValidatableProfile = {
  sourceWallIds: string[];
  edges: { p1: Vec3; p2: Vec3 }[];
  closed: boolean;
  semantic?: "result" | "axes";
};

export type SketchProfileValidateCtx = {
  workplane: Workplane;
  /** Host wall count that still exist (filtered). */
  sourceCount: number;
  /** True if any source wall hosts openings (blocks replace). */
  hasOpenings: boolean;
  /** Template thickness for inset dry-run. */
  thickness: number;
};

export type SketchProfileValidateResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

function ringFromProfile(profile: ValidatableProfile): Vec3[] {
  if (profile.edges.length === 0) return [];
  const pts: Vec3[] = [
    {
      x: profile.edges[0]!.p1.x,
      y: profile.edges[0]!.p1.y,
      z: profile.edges[0]!.p1.z,
    },
  ];
  for (const e of profile.edges) {
    pts.push({ x: e.p2.x, y: e.p2.y, z: e.p2.z });
  }
  if (profile.closed && pts.length >= 2) {
    const a = pts[0]!;
    const b = pts[pts.length - 1]!;
    if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-9) pts.pop();
  }
  return pts;
}

function usableEdgeCount(profile: ValidatableProfile): number {
  let n = 0;
  for (const e of profile.edges) {
    const len = Math.hypot(e.p2.x - e.p1.x, e.p2.y - e.p1.y, e.p2.z - e.p1.z);
    if (len >= MIN_WALL_LENGTH) n++;
  }
  return n;
}

function fail(code: string, message: string): SketchProfileValidateResult {
  return { ok: false, code, message };
}

/**
 * Dry-run rules before replace. Does not touch AxonDocument.
 * Replace always deletes sources — openings block any Terminar.
 */
export function validateSketchProfileForHost(
  profile: ValidatableProfile,
  ctx: SketchProfileValidateCtx,
): SketchProfileValidateResult {
  if (ctx.sourceCount <= 0) {
    return fail("profile.sources.missing", "Los muros del perfil ya no están en el documento");
  }
  if (profile.edges.length === 0 || usableEdgeCount(profile) === 0) {
    return fail(
      "profile.empty",
      "Perfil vacío o segmentos demasiado cortos (mín. 0,05 m)",
    );
  }

  if (ctx.hasOpenings) {
    return fail(
      "profile.openings",
      "No se puede reemplazar: hay puertas/ventanas en muros del perfil",
    );
  }

  const asResult = profile.semantic !== "axes";
  const ring = ringFromProfile(profile);
  const wp = ctx.workplane;

  // Single storey result: prefer invertible footprint; else free edges → axes.
  if (asResult && profile.closed && ctx.sourceCount === 1 && wp.kind === "storey") {
    if (
      profile.edges.length === 4 &&
      ring.length === 4 &&
      isWallBoxFootprint(ring)
    ) {
      const inv = invertStoreyFootprint(ring);
      if (
        inv &&
        inv.thickness >= MIN_THICKNESS &&
        Math.hypot(inv.p2.x - inv.p1.x, inv.p2.y - inv.p1.y) >= MIN_WALL_LENGTH
      ) {
        return { ok: true };
      }
    }
    // Free / non-rect silhouette: each usable edge becomes a wall on replace.
    if (usableEdgeCount(profile) >= 1) return { ok: true };
    return fail(
      "profile.footprint.invert",
      "No se puede convertir la huella en muros (aristas demasiado cortas)",
    );
  }

  if (
    asResult &&
    profile.closed &&
    ctx.sourceCount === 1 &&
    (wp.kind === "surface" || wp.kind === "line")
  ) {
    if (ring.length < 3) {
      return fail("profile.face.shape", "Contorno vertical incompleto");
    }
    const face = invertVerticalFaceOutline(ring, wp);
    if (!face || face.height < MIN_THICKNESS) {
      return fail(
        "profile.face.invert",
        "No se puede convertir el contorno vertical en muro",
      );
    }
    const axis = faceLineToWallAxis(face.p1, face.p2, wp, ctx.thickness);
    if (Math.hypot(axis.p2.x - axis.p1.x, axis.p2.y - axis.p1.y) < MIN_WALL_LENGTH) {
      return fail("profile.face.short", "Eje resultante demasiado corto");
    }
    return { ok: true };
  }

  if (
    asResult &&
    profile.closed &&
    wp.kind === "storey" &&
    ctx.sourceCount >= 3 &&
    profile.edges.length >= 3
  ) {
    const axes = insetRingToAxes(ring, ctx.thickness);
    if (!axes || axes.length < 3) {
      return fail(
        "profile.loop.inset",
        "No se pudo recuperar ejes desde el anillo exterior",
      );
    }
    return { ok: true };
  }

  if (usableEdgeCount(profile) === 0) {
    return fail("profile.axes.short", "Segmentos demasiado cortos");
  }

  return { ok: true };
}
