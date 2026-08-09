/**
 * Hosted-opening fit and overlap (F9-E2 / ADR 0017).
 *
 * One predicate for doors and windows: same rules whether you place a door after
 * a window or a window after a door. Consumed by commands, persistence, and UI.
 *
 * Entity field rules stay in `validate.ts`; this file needs the host wall.
 */
import type { Door, Wall, Window } from "./types.js";
import type { ValidationResult } from "./validate.js";

/** Clearance from wall ends (m). Matches the prior UI margin. */
export const OPENING_END_MARGIN = 0.05;

/** Extra gap between openings beyond half-widths (m). */
export const OPENING_OVERLAP_GAP = 0.02;

/** Clearance from the top of the wall (m). */
export const OPENING_VERTICAL_MARGIN = 0.05;

/** Geometry shared by Door and Window for fit/overlap checks. */
export type HostedOpeningSpec = {
  id: string;
  wallId: string;
  centerOffset: number;
  width: number;
  height: number;
  sill: number;
};

function issue(code: string, message: string): NonNullable<ValidationResult> {
  return { code, message };
}

export function wallLengthXY(wall: Wall): number {
  return Math.hypot(wall.p2.x - wall.p1.x, wall.p2.y - wall.p1.y);
}

export function asOpeningSpec(opening: Door | Window): HostedOpeningSpec {
  return {
    id: opening.id,
    wallId: opening.wallId,
    centerOffset: opening.centerOffset,
    width: opening.width,
    height: opening.height,
    sill: opening.sill,
  };
}

/**
 * Other openings on the same wall, excluding `excludeId` (the candidate itself
 * when resizing / changing family).
 */
export function openingsOnWall(
  wallId: string,
  doors: readonly Door[],
  windows: readonly Window[],
  excludeId?: string,
): HostedOpeningSpec[] {
  const out: HostedOpeningSpec[] = [];
  for (const d of doors) {
    if (d.wallId !== wallId || d.id === excludeId) continue;
    out.push(asOpeningSpec(d));
  }
  for (const w of windows) {
    if (w.wallId !== wallId || w.id === excludeId) continue;
    out.push(asOpeningSpec(w));
  }
  return out;
}

/** Interval along the wall axis, with end margin. */
export function validateOpeningFitsWall(
  opening: HostedOpeningSpec,
  wall: Wall,
): ValidationResult {
  const length = wallLengthXY(wall);
  const half = opening.width / 2;
  const minCenter = half + OPENING_END_MARGIN;
  const maxCenter = length - half - OPENING_END_MARGIN;
  if (opening.centerOffset < minCenter || opening.centerOffset > maxCenter) {
    return issue(
      "opening.endMargin",
      `opening ${opening.id}: too close to wall end (need ${OPENING_END_MARGIN} m clearance)`,
    );
  }
  if (opening.sill + opening.height > wall.height - OPENING_VERTICAL_MARGIN) {
    return issue(
      "opening.verticalFit",
      `opening ${opening.id}: sill+height exceeds wall height (need ${OPENING_VERTICAL_MARGIN} m headroom)`,
    );
  }
  return null;
}

/** True when two axis intervals overlap including the gap. */
export function openingsOverlap(
  a: Pick<HostedOpeningSpec, "centerOffset" | "width">,
  b: Pick<HostedOpeningSpec, "centerOffset" | "width">,
): boolean {
  return (
    Math.abs(a.centerOffset - b.centerOffset) <
    (a.width + b.width) / 2 + OPENING_OVERLAP_GAP
  );
}

export function validateOpeningClearOfOthers(
  opening: HostedOpeningSpec,
  others: readonly HostedOpeningSpec[],
): ValidationResult {
  for (const other of others) {
    if (other.wallId !== opening.wallId) continue;
    if (other.id === opening.id) continue;
    if (openingsOverlap(opening, other)) {
      return issue(
        "opening.overlap",
        `opening ${opening.id}: overlaps ${other.id}`,
      );
    }
  }
  return null;
}

/**
 * Full hosted check: fits the wall and clears every other opening on that wall
 * (doors and windows together — order of placement must not matter).
 */
export function validateHostedOpening(
  opening: HostedOpeningSpec,
  wall: Wall,
  othersOnWall: readonly HostedOpeningSpec[],
): ValidationResult {
  if (wall.id !== opening.wallId) {
    return issue(
      "opening.wall.mismatch",
      `opening ${opening.id}: wall ${wall.id} is not host ${opening.wallId}`,
    );
  }
  return (
    validateOpeningFitsWall(opening, wall) ??
    validateOpeningClearOfOthers(opening, othersOnWall)
  );
}
