/**
 * Runtime shape checks for `.axon` JSON (F9-E5 + SK-wall-profile-v1 Bloque 7).
 * Input is `unknown` — never trust a TypeScript cast from JSON.parse.
 */
import type { DoorFamily, WallFamily, WindowFamily } from "@axonbim/families";
import type {
  Camera,
  DocumentPresentation,
  Door,
  DoorLeafState,
  DoorSwing,
  Storey,
  ViewCrop,
  Wall,
  WallProfilePoint,
  WallVerticalDefinition,
  Window,
} from "@axonbim/model";
import {
  validateWallVerticalDefinition,
  wallLength,
  wallVerticalFromHeight,
} from "@axonbim/model";

/** On-disk / parsed file envelope. v1 and v2 accepted on read; writers emit 2. */
export type AxonFile = {
  format: "axon";
  formatVersion: 1 | 2;
  meta: {
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  storeys: Storey[];
  families: WallFamily[];
  doorFamilies: DoorFamily[];
  windowFamilies: WindowFamily[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  cameras: Camera[];
  presentation?: DocumentPresentation;
};

/** @deprecated Use AxonFile — kept for import paths during migration. */
export type AxonFileV1 = AxonFile;

export function failAxon(msg: string): never {
  throw new Error(`Invalid .axon file: ${msg}`);
}

function isObj(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function readVec3(v: unknown, label: string): { x: number; y: number; z: number } {
  if (!isObj(v)) failAxon(`${label} must be an object`);
  if (!isFiniteNum(v.x) || !isFiniteNum(v.y) || !isFiniteNum(v.z)) {
    failAxon(`${label} must have finite x,y,z`);
  }
  return { x: v.x, y: v.y, z: v.z };
}

function readViewCrop(v: unknown, label: string): ViewCrop {
  if (!isObj(v)) failAxon(`${label} must be an object`);
  if (typeof v.enabled !== "boolean") failAxon(`${label}.enabled required`);
  if (
    !isFiniteNum(v.minX) ||
    !isFiniteNum(v.minY) ||
    !isFiniteNum(v.maxX) ||
    !isFiniteNum(v.maxY)
  ) {
    failAxon(`${label} bounds must be finite`);
  }
  const crop: ViewCrop = {
    enabled: v.enabled,
    minX: v.minX,
    minY: v.minY,
    maxX: v.maxX,
    maxY: v.maxY,
  };
  if (v.minZ !== undefined) {
    if (!isFiniteNum(v.minZ)) failAxon(`${label}.minZ invalid`);
    crop.minZ = v.minZ;
  }
  if (v.maxZ !== undefined) {
    if (!isFiniteNum(v.maxZ)) failAxon(`${label}.maxZ invalid`);
    crop.maxZ = v.maxZ;
  }
  return crop;
}

const HINGES = new Set(["start", "end"]);
const SWINGS = new Set(["positive", "negative"]);
const LEAF = new Set(["closed", "ajar", "open"]);

function readHinge(v: unknown, label: string): "start" | "end" {
  if (typeof v !== "string" || !HINGES.has(v)) failAxon(`${label}: hinge must be start|end`);
  return v as "start" | "end";
}

function readSwing(v: unknown, label: string): DoorSwing {
  if (typeof v !== "string" || !SWINGS.has(v)) {
    failAxon(`${label}: swing must be positive|negative`);
  }
  return v as DoorSwing;
}

function readLeaf(v: unknown, label: string): DoorLeafState {
  if (typeof v !== "string" || !LEAF.has(v)) {
    failAxon(`${label}: leafState must be closed|ajar|open`);
  }
  return v as DoorLeafState;
}

function readArray(v: unknown, label: string): unknown[] {
  if (!Array.isArray(v)) failAxon(`${label} must be an array`);
  return v;
}

function readStorey(v: unknown, i: number): Storey {
  if (!isObj(v)) failAxon(`storeys[${i}] must be an object`);
  if (!isNonEmptyString(v.id)) failAxon(`storeys[${i}].id required`);
  if (!isNonEmptyString(v.name)) failAxon(`storeys[${i}].name required`);
  if (!isFiniteNum(v.elevation)) failAxon(`storeys[${i}].elevation must be finite`);
  return { id: v.id, name: v.name, elevation: v.elevation };
}

function readWallFamily(v: unknown, i: number): WallFamily {
  if (!isObj(v)) failAxon(`families[${i}] must be an object`);
  if (!isNonEmptyString(v.id)) failAxon(`families[${i}].id required`);
  if (!isNonEmptyString(v.label)) failAxon(`families[${i}].label required`);
  if (!isFiniteNum(v.thickness)) failAxon(`families[${i}].thickness must be finite`);
  return { id: v.id, label: v.label, thickness: v.thickness };
}

function readDoorFamily(v: unknown, i: number): DoorFamily {
  if (!isObj(v)) failAxon(`doorFamilies[${i}] must be an object`);
  if (!isNonEmptyString(v.id)) failAxon(`doorFamilies[${i}].id required`);
  if (!isNonEmptyString(v.label)) failAxon(`doorFamilies[${i}].label required`);
  if (!isFiniteNum(v.width) || !isFiniteNum(v.height)) {
    failAxon(`doorFamilies[${i}]: width/height must be finite`);
  }
  return { id: v.id, label: v.label, width: v.width, height: v.height };
}

function readWindowFamily(v: unknown, i: number): WindowFamily {
  if (!isObj(v)) failAxon(`windowFamilies[${i}] must be an object`);
  if (!isNonEmptyString(v.id)) failAxon(`windowFamilies[${i}].id required`);
  if (!isNonEmptyString(v.label)) failAxon(`windowFamilies[${i}].label required`);
  if (!isFiniteNum(v.width) || !isFiniteNum(v.height) || !isFiniteNum(v.sill)) {
    failAxon(`windowFamilies[${i}]: width/height/sill must be finite`);
  }
  return { id: v.id, label: v.label, width: v.width, height: v.height, sill: v.sill };
}

/**
 * Read vertical definition.
 * v1: `height` legacy OR `vertical`.
 * v2: `vertical` required (bare `height` alone rejected).
 */
function readWallVertical(
  v: Record<string, unknown>,
  i: number,
  formatVersion: 1 | 2,
): WallVerticalDefinition {
  const at = `walls[${i}]`;
  if (v.vertical !== undefined) {
    if (!isObj(v.vertical)) failAxon(`${at}.vertical must be an object`);
    const kind = v.vertical.kind;
    if (kind === "uniform") {
      if (!isFiniteNum(v.vertical.height)) {
        failAxon(`${at}.vertical.height must be finite`);
      }
      return wallVerticalFromHeight(v.vertical.height);
    }
    if (kind === "profile") {
      if (!Array.isArray(v.vertical.outerLoop)) {
        failAxon(`${at}.vertical.outerLoop must be an array`);
      }
      const outerLoop: WallProfilePoint[] = v.vertical.outerLoop.map((p, j) => {
        if (!isObj(p) || !isFiniteNum(p.u) || !isFiniteNum(p.v)) {
          failAxon(`${at}.vertical.outerLoop[${j}] must have finite u,v`);
        }
        return { u: p.u, v: p.v };
      });
      return { kind: "profile", outerLoop };
    }
    failAxon(`${at}.vertical.kind must be uniform|profile`);
  }
  if (formatVersion >= 2) {
    failAxon(`${at}: formatVersion 2 requires vertical (legacy height alone rejected)`);
  }
  if (isFiniteNum(v.height)) {
    return wallVerticalFromHeight(v.height);
  }
  failAxon(`${at}: height or vertical required`);
}

function readWall(v: unknown, i: number, formatVersion: 1 | 2): Wall {
  if (!isObj(v)) failAxon(`walls[${i}] must be an object`);
  if (!isNonEmptyString(v.id)) failAxon(`walls[${i}].id required`);
  if (!isNonEmptyString(v.storeyId)) failAxon(`walls[${i}].storeyId required`);
  if (!isNonEmptyString(v.familyId)) failAxon(`walls[${i}].familyId required`);
  if (!isFiniteNum(v.thickness)) {
    failAxon(`walls[${i}]: thickness must be finite`);
  }
  const wall: Wall = {
    id: v.id,
    storeyId: v.storeyId,
    familyId: v.familyId,
    p1: readVec3(v.p1, `walls[${i}].p1`),
    p2: readVec3(v.p2, `walls[${i}].p2`),
    thickness: v.thickness,
    vertical: readWallVertical(v, i, formatVersion),
  };
  const profileIssue = validateWallVerticalDefinition(
    wall.vertical,
    wallLength(wall),
  );
  if (profileIssue) {
    failAxon(`walls[${i}]: ${profileIssue.message}`);
  }
  return wall;
}

/** Wire shape for formatVersion 2 — always `vertical`; never bare `height`. */
export function wallToFileJson(wall: Wall): Record<string, unknown> {
  return {
    id: wall.id,
    storeyId: wall.storeyId,
    familyId: wall.familyId,
    p1: wall.p1,
    p2: wall.p2,
    thickness: wall.thickness,
    vertical:
      wall.vertical.kind === "uniform"
        ? { kind: "uniform", height: wall.vertical.height }
        : {
            kind: "profile",
            outerLoop: wall.vertical.outerLoop.map((p) => ({ u: p.u, v: p.v })),
          },
  };
}

function readDoor(v: unknown, i: number): Door {
  if (!isObj(v)) failAxon(`doors[${i}] must be an object`);
  const at = `doors[${i}]`;
  if (!isNonEmptyString(v.id)) failAxon(`${at}.id required`);
  if (!isNonEmptyString(v.wallId)) failAxon(`${at}.wallId required`);
  if (!isNonEmptyString(v.familyId)) failAxon(`${at}.familyId required`);
  if (!isFiniteNum(v.centerOffset) || !isFiniteNum(v.width) || !isFiniteNum(v.height)) {
    failAxon(`${at}: centerOffset/width/height must be finite`);
  }
  if (!isFiniteNum(v.sill)) failAxon(`${at}.sill required (finite)`);
  return {
    id: v.id,
    wallId: v.wallId,
    familyId: v.familyId,
    centerOffset: v.centerOffset,
    width: v.width,
    height: v.height,
    sill: v.sill,
    hinge: readHinge(v.hinge, at),
    swing: readSwing(v.swing, at),
    leafState: readLeaf(v.leafState, at),
  };
}

function readWindow(v: unknown, i: number): Window {
  if (!isObj(v)) failAxon(`windows[${i}] must be an object`);
  const at = `windows[${i}]`;
  if (!isNonEmptyString(v.id)) failAxon(`${at}.id required`);
  if (!isNonEmptyString(v.wallId)) failAxon(`${at}.wallId required`);
  if (!isNonEmptyString(v.familyId)) failAxon(`${at}.familyId required`);
  if (!isFiniteNum(v.centerOffset) || !isFiniteNum(v.width) || !isFiniteNum(v.height)) {
    failAxon(`${at}: centerOffset/width/height must be finite`);
  }
  if (!isFiniteNum(v.sill)) failAxon(`${at}.sill required (finite)`);
  return {
    id: v.id,
    wallId: v.wallId,
    familyId: v.familyId,
    centerOffset: v.centerOffset,
    width: v.width,
    height: v.height,
    sill: v.sill,
    hinge: readHinge(v.hinge, at),
    swing: readSwing(v.swing, at),
    leafState: readLeaf(v.leafState, at),
  };
}

function readCamera(v: unknown, i: number): Camera {
  if (!isObj(v)) failAxon(`cameras[${i}] must be an object`);
  const at = `cameras[${i}]`;
  if (!isNonEmptyString(v.id)) failAxon(`${at}.id required`);
  if (!isNonEmptyString(v.name)) failAxon(`${at}.name required`);
  if (!isFiniteNum(v.fov)) failAxon(`${at}.fov required (finite)`);
  if (v.crop === undefined) failAxon(`${at}.crop required`);
  return {
    id: v.id,
    name: v.name,
    eye: readVec3(v.eye, `${at}.eye`),
    target: readVec3(v.target, `${at}.target`),
    fov: v.fov,
    crop: readViewCrop(v.crop, `${at}.crop`),
  };
}

function readPresentation(v: unknown): DocumentPresentation | undefined {
  if (v === undefined) return undefined;
  if (!isObj(v)) failAxon("presentation must be an object");
  if (!("viewCrops" in v)) failAxon("presentation.viewCrops required when presentation is set");
  if (!isObj(v.viewCrops)) failAxon("presentation.viewCrops must be an object");
  const viewCrops: Record<string, ViewCrop> = {};
  for (const [viewId, crop] of Object.entries(v.viewCrops)) {
    if (!isNonEmptyString(viewId)) failAxon("presentation.viewCrops keys must be non-empty");
    viewCrops[viewId] = readViewCrop(crop, `presentation.viewCrops[${viewId}]`);
  }
  return { viewCrops };
}

/** Strict shape: every required field present; no silent defaults. Accepts v1|v2. */
export function readAxonFileStrict(data: unknown): AxonFile {
  if (!isObj(data)) failAxon("root must be an object");
  if (data.format !== "axon") failAxon('format must be "axon"');
  const formatVersion = data.formatVersion;
  if (formatVersion !== 1 && formatVersion !== 2) {
    failAxon(
      `unsupported formatVersion: ${String(formatVersion)} (supported: 1, 2)`,
    );
  }
  if (!isObj(data.meta)) failAxon("meta must be an object");
  if (!isNonEmptyString(data.meta.name)) failAxon("missing meta.name");
  if (!isNonEmptyString(data.meta.createdAt)) failAxon("missing meta.createdAt");
  if (!isNonEmptyString(data.meta.updatedAt)) failAxon("missing meta.updatedAt");

  const storeys = readArray(data.storeys, "storeys").map(readStorey);
  if (storeys.length === 0) failAxon("missing storeys");

  if (!("families" in data)) failAxon("missing families");
  if (!("doorFamilies" in data)) failAxon("missing doorFamilies");
  if (!("windowFamilies" in data)) failAxon("missing windowFamilies");
  if (!("walls" in data)) failAxon("missing walls");
  if (!("doors" in data)) failAxon("missing doors");
  if (!("windows" in data)) failAxon("missing windows");
  if (!("cameras" in data)) failAxon("missing cameras");

  const presentation = readPresentation(data.presentation);

  return {
    format: "axon",
    formatVersion,
    meta: {
      name: data.meta.name,
      createdAt: data.meta.createdAt,
      updatedAt: data.meta.updatedAt,
    },
    storeys,
    families: readArray(data.families, "families").map(readWallFamily),
    doorFamilies: readArray(data.doorFamilies, "doorFamilies").map(readDoorFamily),
    windowFamilies: readArray(data.windowFamilies, "windowFamilies").map(readWindowFamily),
    walls: readArray(data.walls, "walls").map((w, i) => readWall(w, i, formatVersion)),
    doors: readArray(data.doors, "doors").map(readDoor),
    windows: readArray(data.windows, "windows").map(readWindow),
    cameras: readArray(data.cameras, "cameras").map(readCamera),
    ...(presentation ? { presentation } : {}),
  };
}

/** Soft readers for recovery — return null + reason instead of throwing. */
export function tryReadWall(
  v: unknown,
  i: number,
  formatVersion: 1 | 2 = 2,
): { ok: true; value: Wall } | { ok: false; reason: string } {
  try {
    return { ok: true, value: readWall(v, i, formatVersion) };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export function tryReadDoor(v: unknown, i: number): { ok: true; value: Door } | { ok: false; reason: string } {
  try {
    return { ok: true, value: readDoor(v, i) };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export function tryReadWindow(
  v: unknown,
  i: number,
): { ok: true; value: Window } | { ok: false; reason: string } {
  try {
    return { ok: true, value: readWindow(v, i) };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export function tryReadCamera(
  v: unknown,
  i: number,
): { ok: true; value: Camera } | { ok: false; reason: string } {
  try {
    return { ok: true, value: readCamera(v, i) };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : String(e) };
  }
}

export {
  isObj,
  isFiniteNum,
  isNonEmptyString,
  readArray,
  readPresentation,
  readStorey,
  readWallFamily,
  readDoorFamily,
  readWindowFamily,
  readViewCrop,
  readVec3,
};
