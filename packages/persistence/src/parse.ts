/**
 * F9-E5 — `.axon` frontier.
 *
 * - `parseDocument` (strict / Abrir): hard reject; no silent defaults or crop normalize.
 * - `parseDocumentRecover` (Recuperar / `.bak`): salvage + warnings; result always valid.
 */
import {
  BUILTIN_DOOR_FAMILIES,
  BUILTIN_WINDOW_FAMILIES,
  type DoorFamily,
  type WallFamily,
  type WindowFamily,
} from "@axonbim/families";
import type {
  AxonDocument,
  Camera,
  DocumentPresentation,
  DocumentRefs,
  Door,
  Storey,
  ValidationResult,
  ViewCrop,
  Wall,
  Window,
} from "@axonbim/model";
import {
  asOpeningSpec,
  cloneViewCrop,
  defaultCameraCrop,
  normalizeViewCrop,
  openingsOnWall,
  validateCamera,
  validateDoor,
  validateHostedOpening,
  validateViewCrop,
  validateWall,
  validateWindow,
} from "@axonbim/model";
import {
  MAX_AXON_TEXT_BYTES,
  MAX_CAMERAS,
  MAX_DOORS,
  MAX_DOOR_FAMILIES,
  MAX_STOREYS,
  MAX_WALLS,
  MAX_WALL_FAMILIES,
  MAX_WINDOWS,
  MAX_WINDOW_FAMILIES,
} from "./limits.js";
import {
  failAxon,
  isFiniteNum,
  isNonEmptyString,
  isObj,
  readArray,
  readAxonFileStrict,
  readDoorFamily,
  readPresentation,
  readStorey,
  readWallFamily,
  readWindowFamily,
  tryReadCamera,
  tryReadDoor,
  tryReadWall,
  tryReadWindow,
  type AxonFile,
} from "./shape.js";

export type RecoverResult = {
  document: AxonDocument;
  warnings: string[];
};

function checkCaps(file: AxonFile): void {
  if (file.storeys.length > MAX_STOREYS) failAxon(`too many storeys (>${MAX_STOREYS})`);
  if (file.families.length > MAX_WALL_FAMILIES) {
    failAxon(`too many families (>${MAX_WALL_FAMILIES})`);
  }
  if (file.doorFamilies.length > MAX_DOOR_FAMILIES) {
    failAxon(`too many doorFamilies (>${MAX_DOOR_FAMILIES})`);
  }
  if (file.windowFamilies.length > MAX_WINDOW_FAMILIES) {
    failAxon(`too many windowFamilies (>${MAX_WINDOW_FAMILIES})`);
  }
  if (file.walls.length > MAX_WALLS) failAxon(`too many walls (>${MAX_WALLS})`);
  if (file.doors.length > MAX_DOORS) failAxon(`too many doors (>${MAX_DOORS})`);
  if (file.windows.length > MAX_WINDOWS) failAxon(`too many windows (>${MAX_WINDOWS})`);
  if (file.cameras.length > MAX_CAMERAS) failAxon(`too many cameras (>${MAX_CAMERAS})`);
}

function assertUniqueIds(file: AxonFile): void {
  const seen = new Map<string, string>();
  const claim = (id: string, kind: string) => {
    const prev = seen.get(id);
    if (prev) failAxon(`duplicate id "${id}" (${prev} and ${kind})`);
    seen.set(id, kind);
  };
  for (const s of file.storeys) claim(s.id, "storey");
  for (const f of file.families) claim(f.id, "wallFamily");
  for (const f of file.doorFamilies) claim(f.id, "doorFamily");
  for (const f of file.windowFamilies) claim(f.id, "windowFamily");
  for (const w of file.walls) claim(w.id, "wall");
  for (const d of file.doors) claim(d.id, "door");
  for (const w of file.windows) claim(w.id, "window");
  for (const c of file.cameras) claim(c.id, "camera");
}

function checkIssue(issue: ValidationResult): void {
  if (issue) failAxon(issue.message);
}

function toDocument(file: AxonFile): AxonDocument {
  return {
    meta: {
      format: "axon",
      // Always promote to v2 in memory after read (ADR 0018 Bloque 7).
      formatVersion: 2,
      name: file.meta.name,
      createdAt: file.meta.createdAt,
      updatedAt: file.meta.updatedAt,
    },
    storeys: file.storeys,
    families: file.families,
    doorFamilies: file.doorFamilies,
    windowFamilies: file.windowFamilies,
    walls: file.walls,
    doors: file.doors,
    windows: file.windows,
    cameras: file.cameras,
    presentation: file.presentation ?? { viewCrops: {} },
  };
}

function validateSemantics(file: AxonFile): void {
  const refs: DocumentRefs = {
    storeyIds: new Set(file.storeys.map((s) => s.id)),
    wallFamilyIds: new Set(file.families.map((f) => f.id)),
    doorFamilyIds: new Set(file.doorFamilies.map((f) => f.id)),
    windowFamilyIds: new Set(file.windowFamilies.map((f) => f.id)),
    wallIds: new Set(file.walls.map((w) => w.id)),
  };
  for (const w of file.walls) checkIssue(validateWall(w, refs));
  for (const d of file.doors) checkIssue(validateDoor(d, refs));
  for (const w of file.windows) checkIssue(validateWindow(w, refs));
  for (const c of file.cameras) checkIssue(validateCamera(c));
  if (file.presentation?.viewCrops) {
    for (const [viewId, crop] of Object.entries(file.presentation.viewCrops)) {
      checkIssue(validateViewCrop(crop, `presentation.viewCrops[${viewId}]`));
      if (!crop.enabled) {
        failAxon(`presentation.viewCrops[${viewId}]: only enabled crops may be stored`);
      }
    }
  }

  const wallById = new Map(file.walls.map((w) => [w.id, w]));
  for (const d of file.doors) {
    const wall = wallById.get(d.wallId);
    if (!wall) continue;
    checkIssue(
      validateHostedOpening(
        asOpeningSpec(d),
        wall,
        openingsOnWall(d.wallId, file.doors, file.windows, d.id),
      ),
    );
  }
  for (const w of file.windows) {
    const wall = wallById.get(w.wallId);
    if (!wall) continue;
    checkIssue(
      validateHostedOpening(
        asOpeningSpec(w),
        wall,
        openingsOnWall(w.wallId, file.doors, file.windows, w.id),
      ),
    );
  }
}

function parseJsonRoot(text: string): unknown {
  if (typeof text !== "string") failAxon("input must be text");
  if (text.length > MAX_AXON_TEXT_BYTES) {
    failAxon(`file too large (>${MAX_AXON_TEXT_BYTES} bytes)`);
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    failAxon("JSON parse error");
  }
}

/** Strict open (Archivo → Abrir). */
export function parseDocument(text: string): AxonDocument {
  const root = parseJsonRoot(text);
  const file = readAxonFileStrict(root);
  checkCaps(file);
  assertUniqueIds(file);
  validateSemantics(file);
  return toDocument(file);
}

function stripInvalidPrefix(msg: string): string {
  return msg.replace(/^Invalid \.axon file: /, "");
}

function recoverCatalogs(
  data: Record<string, unknown>,
  warnings: string[],
): {
  storeys: Storey[];
  families: WallFamily[];
  doorFamilies: DoorFamily[];
  windowFamilies: WindowFamily[];
} {
  let storeys: Storey[] = [];
  try {
    storeys = readArray(data.storeys, "storeys").map(readStorey);
  } catch (e) {
    warnings.push(`storeys: ${stripInvalidPrefix(e instanceof Error ? e.message : String(e))}`);
  }
  if (storeys.length === 0) {
    warnings.push("storeys missing/invalid — inserted storey.default");
    storeys = [{ id: "storey.default", name: "Nivel 1", elevation: 0 }];
  }

  let families: WallFamily[] = [];
  try {
    if ("families" in data) {
      families = readArray(data.families, "families").map(readWallFamily);
    } else {
      warnings.push("missing families — using empty catalog");
    }
  } catch (e) {
    warnings.push(`families: ${stripInvalidPrefix(e instanceof Error ? e.message : String(e))}`);
  }

  let doorFamilies: DoorFamily[];
  if (!("doorFamilies" in data) || data.doorFamilies == null) {
    doorFamilies = [...BUILTIN_DOOR_FAMILIES];
    warnings.push("missing doorFamilies — seeded built-ins");
  } else {
    try {
      doorFamilies = readArray(data.doorFamilies, "doorFamilies").map(readDoorFamily);
    } catch (e) {
      doorFamilies = [...BUILTIN_DOOR_FAMILIES];
      warnings.push(
        `doorFamilies invalid — seeded built-ins (${stripInvalidPrefix(e instanceof Error ? e.message : String(e))})`,
      );
    }
  }

  let windowFamilies: WindowFamily[];
  if (!("windowFamilies" in data) || data.windowFamilies == null) {
    windowFamilies = [...BUILTIN_WINDOW_FAMILIES];
    warnings.push("missing windowFamilies — seeded built-ins");
  } else {
    try {
      windowFamilies = readArray(data.windowFamilies, "windowFamilies").map(readWindowFamily);
    } catch (e) {
      windowFamilies = [...BUILTIN_WINDOW_FAMILIES];
      warnings.push(
        `windowFamilies invalid — seeded built-ins (${stripInvalidPrefix(e instanceof Error ? e.message : String(e))})`,
      );
    }
  }

  return { storeys, families, doorFamilies, windowFamilies };
}

function recoverSoftDoor(raw: unknown, i: number, warnings: string[]): Door | null {
  if (!isObj(raw)) {
    warnings.push(`doors[${i}] discarded: not an object`);
    return null;
  }
  const patched: Record<string, unknown> = { ...raw };
  if (patched.leafState === undefined) {
    patched.leafState = "open";
    warnings.push(`doors[${i}]: defaulted leafState=open`);
  }
  if (patched.swing === undefined) {
    patched.swing = "positive";
    warnings.push(`doors[${i}]: defaulted swing=positive`);
  }
  if (patched.hinge === undefined) {
    patched.hinge = "start";
    warnings.push(`doors[${i}]: defaulted hinge=start`);
  }
  if (patched.sill === undefined) {
    patched.sill = 0;
    warnings.push(`doors[${i}]: defaulted sill=0`);
  }
  const r = tryReadDoor(patched, i);
  if (!r.ok) {
    warnings.push(`doors[${i}] discarded: ${stripInvalidPrefix(r.reason)}`);
    return null;
  }
  return r.value;
}

function recoverSoftWindow(raw: unknown, i: number, warnings: string[]): Window | null {
  if (!isObj(raw)) {
    warnings.push(`windows[${i}] discarded: not an object`);
    return null;
  }
  const patched: Record<string, unknown> = { ...raw };
  if (patched.leafState === undefined) {
    patched.leafState = "closed";
    warnings.push(`windows[${i}]: defaulted leafState=closed`);
  }
  if (patched.swing === undefined) {
    patched.swing = "positive";
    warnings.push(`windows[${i}]: defaulted swing=positive`);
  }
  if (patched.hinge === undefined) {
    patched.hinge = "start";
    warnings.push(`windows[${i}]: defaulted hinge=start`);
  }
  if (patched.sill === undefined) {
    patched.sill = 0.9;
    warnings.push(`windows[${i}]: defaulted sill=0.9`);
  }
  const r = tryReadWindow(patched, i);
  if (!r.ok) {
    warnings.push(`windows[${i}] discarded: ${stripInvalidPrefix(r.reason)}`);
    return null;
  }
  return r.value;
}

function recoverSoftCamera(raw: unknown, i: number, warnings: string[]): Camera | null {
  if (!isObj(raw)) {
    warnings.push(`cameras[${i}] discarded: not an object`);
    return null;
  }
  const patched: Record<string, unknown> = { ...raw };
  if (patched.fov === undefined) {
    patched.fov = 45;
    warnings.push(`cameras[${i}]: defaulted fov=45`);
  }
  const eyeOk =
    isObj(patched.eye) &&
    isFiniteNum(patched.eye.x) &&
    isFiniteNum(patched.eye.y) &&
    isFiniteNum(patched.eye.z);
  const targetOk =
    isObj(patched.target) &&
    isFiniteNum(patched.target.x) &&
    isFiniteNum(patched.target.y) &&
    isFiniteNum(patched.target.z);
  if (!eyeOk || !targetOk) {
    warnings.push(`cameras[${i}] discarded: eye/target invalid`);
    return null;
  }
  const eye = {
    x: (patched.eye as { x: number }).x,
    y: (patched.eye as { y: number }).y,
    z: (patched.eye as { z: number }).z,
  };
  const target = {
    x: (patched.target as { x: number }).x,
    y: (patched.target as { y: number }).y,
    z: (patched.target as { z: number }).z,
  };
  const fov = isFiniteNum(patched.fov) ? patched.fov : 45;

  if (patched.crop === undefined || !isObj(patched.crop)) {
    patched.crop = defaultCameraCrop(eye, target, fov);
    warnings.push(`cameras[${i}]: missing crop — synthesized default`);
  } else {
    try {
      const normalized = normalizeViewCrop({
        enabled: typeof patched.crop.enabled === "boolean" ? patched.crop.enabled : true,
        minX: Number(patched.crop.minX),
        minY: Number(patched.crop.minY),
        maxX: Number(patched.crop.maxX),
        maxY: Number(patched.crop.maxY),
        minZ: patched.crop.minZ !== undefined ? Number(patched.crop.minZ) : undefined,
        maxZ: patched.crop.maxZ !== undefined ? Number(patched.crop.maxZ) : undefined,
      });
      if (
        !isFiniteNum(patched.crop.minX) ||
        !isFiniteNum(patched.crop.maxX) ||
        Number(patched.crop.maxX) <= Number(patched.crop.minX) ||
        Number(patched.crop.maxY) <= Number(patched.crop.minY)
      ) {
        warnings.push(`cameras[${i}]: crop repaired via normalizeViewCrop`);
      }
      patched.crop = normalized;
    } catch {
      patched.crop = defaultCameraCrop(eye, target, fov);
      warnings.push(`cameras[${i}]: crop invalid — synthesized default`);
    }
  }

  const r = tryReadCamera(patched, i);
  if (!r.ok) {
    warnings.push(`cameras[${i}] discarded: ${stripInvalidPrefix(r.reason)}`);
    return null;
  }
  const camIssue = validateCamera(r.value);
  if (camIssue) {
    warnings.push(`cameras[${i}] discarded: ${camIssue.message}`);
    return null;
  }
  return r.value;
}

/**
 * Recovery open (Archivo → Recuperar copia… / `.axon.bak`).
 * JSON must still parse; semantic/shape damage is salvaged with warnings.
 */
export function parseDocumentRecover(text: string): RecoverResult {
  const warnings: string[] = [];
  const root = parseJsonRoot(text);
  if (!isObj(root)) failAxon("root must be an object");

  if (root.format !== "axon") {
    warnings.push(`format was ${JSON.stringify(root.format)} — treating as axon`);
  }
  let recoverFormat: 1 | 2 = 2;
  if (root.formatVersion === 1) {
    recoverFormat = 1;
    warnings.push("formatVersion 1 — migrated to vertical / v2 in memory");
  } else if (root.formatVersion === 2) {
    recoverFormat = 2;
  } else if (root.formatVersion !== undefined) {
    warnings.push(
      `formatVersion was ${String(root.formatVersion)} — treating as 2`,
    );
  }

  const metaObj = isObj(root.meta) ? root.meta : {};
  const name = isNonEmptyString(metaObj.name) ? metaObj.name : "Recuperado";
  if (!isNonEmptyString(metaObj.name)) warnings.push("meta.name missing — using Recuperado");
  const now = new Date().toISOString();
  const createdAt = isNonEmptyString(metaObj.createdAt) ? metaObj.createdAt : now;
  const updatedAt = isNonEmptyString(metaObj.updatedAt) ? metaObj.updatedAt : now;

  const catalogs = recoverCatalogs(root, warnings);

  const walls: Wall[] = [];
  const wallRaw = Array.isArray(root.walls) ? root.walls : [];
  if (!Array.isArray(root.walls)) warnings.push("walls missing/invalid — treated as []");
  wallRaw.slice(0, MAX_WALLS).forEach((raw, i) => {
    const r = tryReadWall(raw, i, recoverFormat);
    if (!r.ok) {
      warnings.push(`walls[${i}] discarded: ${stripInvalidPrefix(r.reason)}`);
      return;
    }
    walls.push(r.value);
  });
  if (wallRaw.length > MAX_WALLS) {
    warnings.push(`walls truncated to ${MAX_WALLS}`);
  }

  const doors: Door[] = [];
  const doorRaw = Array.isArray(root.doors) ? root.doors : [];
  if (root.doors !== undefined && !Array.isArray(root.doors)) {
    warnings.push("doors invalid — treated as []");
  }
  doorRaw.slice(0, MAX_DOORS).forEach((raw, i) => {
    const d = recoverSoftDoor(raw, i, warnings);
    if (d) doors.push(d);
  });

  const windows: Window[] = [];
  const windowRaw = Array.isArray(root.windows) ? root.windows : [];
  if (root.windows !== undefined && !Array.isArray(root.windows)) {
    warnings.push("windows invalid — treated as []");
  }
  windowRaw.slice(0, MAX_WINDOWS).forEach((raw, i) => {
    const w = recoverSoftWindow(raw, i, warnings);
    if (w) windows.push(w);
  });

  const cameras: Camera[] = [];
  const cameraRaw = Array.isArray(root.cameras) ? root.cameras : [];
  if (root.cameras !== undefined && !Array.isArray(root.cameras)) {
    warnings.push("cameras invalid — treated as []");
  }
  cameraRaw.slice(0, MAX_CAMERAS).forEach((raw, i) => {
    const c = recoverSoftCamera(raw, i, warnings);
    if (c) cameras.push(c);
  });

  // Drop duplicate ids (keep first).
  const dropDupes = <T extends { id: string }>(list: T[], label: string): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of list) {
      if (seen.has(item.id)) {
        warnings.push(`${label} ${item.id} discarded: duplicate id`);
        continue;
      }
      seen.add(item.id);
      out.push(item);
    }
    return out;
  };

  let wallsU = dropDupes(walls, "wall");
  let doorsU = dropDupes(doors, "door");
  let windowsU = dropDupes(windows, "window");
  const camerasU = dropDupes(cameras, "camera");

  const refs: DocumentRefs = {
    storeyIds: new Set(catalogs.storeys.map((s) => s.id)),
    wallFamilyIds: new Set(catalogs.families.map((f) => f.id)),
    doorFamilyIds: new Set(catalogs.doorFamilies.map((f) => f.id)),
    windowFamilyIds: new Set(catalogs.windowFamilies.map((f) => f.id)),
    wallIds: new Set(wallsU.map((w) => w.id)),
  };

  wallsU = wallsU.filter((w) => {
    const issue = validateWall(w, refs);
    if (issue) {
      warnings.push(`wall ${w.id} discarded: ${issue.message}`);
      return false;
    }
    return true;
  });
  refs.wallIds = new Set(wallsU.map((w) => w.id));

  doorsU = doorsU.filter((d) => {
    const issue = validateDoor(d, refs);
    if (issue) {
      warnings.push(`door ${d.id} discarded: ${issue.message}`);
      return false;
    }
    return true;
  });
  windowsU = windowsU.filter((w) => {
    const issue = validateWindow(w, refs);
    if (issue) {
      warnings.push(`window ${w.id} discarded: ${issue.message}`);
      return false;
    }
    return true;
  });

  // Opening fit: keep doors first, then windows (later conflicts discarded).
  const wallById = new Map(wallsU.map((w) => [w.id, w]));
  const keepDoors: Door[] = [];
  for (const d of doorsU) {
    const wall = wallById.get(d.wallId);
    if (!wall) {
      warnings.push(`door ${d.id} discarded: wall missing`);
      continue;
    }
    const issue = validateHostedOpening(
      asOpeningSpec(d),
      wall,
      openingsOnWall(d.wallId, keepDoors, [], d.id),
    );
    if (issue) {
      warnings.push(`door ${d.id} discarded: ${issue.message}`);
      continue;
    }
    keepDoors.push(d);
  }
  const keepWindows: Window[] = [];
  for (const w of windowsU) {
    const wall = wallById.get(w.wallId);
    if (!wall) {
      warnings.push(`window ${w.id} discarded: wall missing`);
      continue;
    }
    const issue = validateHostedOpening(
      asOpeningSpec(w),
      wall,
      openingsOnWall(w.wallId, keepDoors, keepWindows, w.id),
    );
    if (issue) {
      warnings.push(`window ${w.id} discarded: ${issue.message}`);
      continue;
    }
    keepWindows.push(w);
  }

  let presentation: DocumentPresentation | undefined;
  if (root.presentation !== undefined) {
    try {
      const strictPres = readPresentation(root.presentation);
      if (strictPres) {
        const viewCrops: Record<string, ViewCrop> = {};
        for (const [viewId, crop] of Object.entries(strictPres.viewCrops)) {
          const issue = validateViewCrop(crop, `presentation.viewCrops[${viewId}]`);
          if (issue || !crop.enabled) {
            // Repair inverted / disabled: keep only valid enabled crops.
            try {
              const fixed = normalizeViewCrop(cloneViewCrop({ ...crop, enabled: true }));
              const fixedIssue = validateViewCrop(fixed, `presentation.viewCrops[${viewId}]`);
              if (fixedIssue) {
                warnings.push(`presentation.viewCrops[${viewId}] discarded: ${fixedIssue.message}`);
              } else {
                viewCrops[viewId] = fixed;
                warnings.push(`presentation.viewCrops[${viewId}] repaired`);
              }
            } catch {
              warnings.push(`presentation.viewCrops[${viewId}] discarded`);
            }
          } else {
            viewCrops[viewId] = cloneViewCrop(crop);
          }
        }
        if (Object.keys(viewCrops).length > 0) presentation = { viewCrops };
      }
    } catch (e) {
      warnings.push(
        `presentation discarded: ${stripInvalidPrefix(e instanceof Error ? e.message : String(e))}`,
      );
    }
  }

  const file: AxonFile = {
    format: "axon",
    formatVersion: 2,
    meta: { name, createdAt, updatedAt },
    storeys: catalogs.storeys,
    families: catalogs.families,
    doorFamilies: catalogs.doorFamilies,
    windowFamilies: catalogs.windowFamilies,
    walls: wallsU,
    doors: keepDoors,
    windows: keepWindows,
    cameras: camerasU,
    ...(presentation ? { presentation } : {}),
  };

  // Final strict semantic pass — should never fail; if it does, strip to empty shell.
  try {
    checkCaps(file);
    assertUniqueIds(file);
    validateSemantics(file);
  } catch (e) {
    warnings.push(
      `recovery fallback to catalogs only: ${stripInvalidPrefix(e instanceof Error ? e.message : String(e))}`,
    );
    return {
      document: toDocument({
        ...file,
        walls: [],
        doors: [],
        windows: [],
        cameras: [],
      }),
      warnings,
    };
  }

  return { document: toDocument(file), warnings };
}
