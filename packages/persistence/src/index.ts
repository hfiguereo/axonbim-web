import type { AxonDocument, Door, Wall, Window } from "@axonbim/model";
import { MIN_WALL_LENGTH } from "@axonbim/shared";

const DEFAULT_DOOR_FAMILIES: AxonDocument["doorFamilies"] = [
  { id: "family.door-80", label: "Puerta 80", width: 0.8, height: 2.1 },
  { id: "family.door-90", label: "Puerta 90", width: 0.9, height: 2.1 },
  { id: "family.door-100", label: "Puerta 100", width: 1.0, height: 2.1 },
];

const DEFAULT_WINDOW_FAMILIES: AxonDocument["windowFamilies"] = [
  { id: "family.window-60x100", label: "Ventana 60×100", width: 0.6, height: 1.0, sill: 0.9 },
  { id: "family.window-90x120", label: "Ventana 90×120", width: 0.9, height: 1.2, sill: 0.9 },
  { id: "family.window-120x120", label: "Ventana 120×120", width: 1.2, height: 1.2, sill: 0.9 },
];

export type AxonFileV1 = {
  format: "axon";
  formatVersion: 1;
  meta: {
    name: string;
    createdAt: string;
    updatedAt: string;
  };
  storeys: AxonDocument["storeys"];
  families: AxonDocument["families"];
  doorFamilies?: AxonDocument["doorFamilies"];
  windowFamilies?: AxonDocument["windowFamilies"];
  walls: AxonDocument["walls"];
  doors?: Door[];
  windows?: Window[];
};

function fail(msg: string): never {
  throw new Error(`Invalid .axon file: ${msg}`);
}

function isFiniteNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function assertVec3(v: unknown, label: string): void {
  if (!v || typeof v !== "object") fail(`${label} must be an object`);
  const o = v as Record<string, unknown>;
  if (!isFiniteNum(o.x) || !isFiniteNum(o.y) || !isFiniteNum(o.z)) {
    fail(`${label} must have finite x,y,z`);
  }
}

function validateWall(w: Wall, storeyIds: Set<string>, familyIds: Set<string>): void {
  if (!w.id || typeof w.id !== "string") fail("wall.id required");
  if (!storeyIds.has(w.storeyId)) fail(`wall ${w.id}: unknown storeyId`);
  if (!familyIds.has(w.familyId)) fail(`wall ${w.id}: unknown familyId`);
  assertVec3(w.p1, `wall ${w.id}.p1`);
  assertVec3(w.p2, `wall ${w.id}.p2`);
  if (!isFiniteNum(w.height) || w.height <= 0) fail(`wall ${w.id}: invalid height`);
  if (!isFiniteNum(w.thickness) || w.thickness <= 0) fail(`wall ${w.id}: invalid thickness`);
  const len = Math.hypot(w.p2.x - w.p1.x, w.p2.y - w.p1.y);
  if (len < MIN_WALL_LENGTH) fail(`wall ${w.id}: axis too short`);
}

function validateDoor(
  d: Door,
  wallIds: Set<string>,
  doorFamilyIds: Set<string>,
): void {
  if (!d.id || typeof d.id !== "string") fail("door.id required");
  if (!wallIds.has(d.wallId)) fail(`door ${d.id}: unknown wallId`);
  if (!doorFamilyIds.has(d.familyId)) fail(`door ${d.id}: unknown familyId`);
  if (!isFiniteNum(d.width) || d.width <= 0) fail(`door ${d.id}: invalid width`);
  if (!isFiniteNum(d.height) || d.height <= 0) fail(`door ${d.id}: invalid height`);
  if (!isFiniteNum(d.centerOffset) || d.centerOffset < 0) {
    fail(`door ${d.id}: invalid centerOffset`);
  }
  if (!isFiniteNum(d.sill) || d.sill < 0) fail(`door ${d.id}: invalid sill`);
}

function validateWindow(
  w: Window,
  wallIds: Set<string>,
  windowFamilyIds: Set<string>,
): void {
  if (!w.id || typeof w.id !== "string") fail("window.id required");
  if (!wallIds.has(w.wallId)) fail(`window ${w.id}: unknown wallId`);
  if (!windowFamilyIds.has(w.familyId)) fail(`window ${w.id}: unknown familyId`);
  if (!isFiniteNum(w.width) || w.width <= 0) fail(`window ${w.id}: invalid width`);
  if (!isFiniteNum(w.height) || w.height <= 0) fail(`window ${w.id}: invalid height`);
  if (!isFiniteNum(w.centerOffset) || w.centerOffset < 0) {
    fail(`window ${w.id}: invalid centerOffset`);
  }
  if (!isFiniteNum(w.sill) || w.sill < 0) fail(`window ${w.id}: invalid sill`);
}

export function serializeDocument(doc: AxonDocument): string {
  const file: AxonFileV1 = {
    format: "axon",
    formatVersion: 1,
    meta: {
      name: doc.meta.name,
      createdAt: doc.meta.createdAt,
      updatedAt: doc.meta.updatedAt,
    },
    storeys: doc.storeys,
    families: doc.families,
    doorFamilies: doc.doorFamilies,
    windowFamilies: doc.windowFamilies,
    walls: doc.walls,
    doors: doc.doors,
    windows: doc.windows,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function parseDocument(text: string): AxonDocument {
  let data: Partial<AxonFileV1>;
  try {
    data = JSON.parse(text) as Partial<AxonFileV1>;
  } catch {
    fail("JSON parse error");
  }
  if (data.format !== "axon") fail('format must be "axon"');
  if (data.formatVersion !== 1) fail(`unsupported formatVersion: ${String(data.formatVersion)}`);
  if (!data.meta?.name || typeof data.meta.name !== "string") fail("missing meta.name");
  if (!data.storeys?.length) fail("missing storeys");

  const storeys = data.storeys;
  const families = data.families ?? [];
  const doorFamilies = data.doorFamilies?.length
    ? data.doorFamilies
    : [...DEFAULT_DOOR_FAMILIES];
  const windowFamilies = data.windowFamilies?.length
    ? data.windowFamilies
    : [...DEFAULT_WINDOW_FAMILIES];
  const walls = (data.walls ?? []) as Wall[];
  const doors = (data.doors ?? []).map((d) => ({
    ...d,
    leafState: d.leafState ?? "open",
    swing: d.swing ?? "positive",
    hinge: d.hinge ?? "start",
  })) as Door[];
  const windows = (data.windows ?? []).map((w) => ({
    ...w,
    leafState: w.leafState ?? "closed",
    swing: w.swing ?? "positive",
    hinge: w.hinge ?? "start",
    sill: w.sill ?? 0.9,
  })) as Window[];

  const storeyIds = new Set(storeys.map((s) => s.id));
  const familyIds = new Set(families.map((f) => f.id));
  const doorFamilyIds = new Set(doorFamilies.map((f) => f.id));
  const windowFamilyIds = new Set(windowFamilies.map((f) => f.id));
  const wallIds = new Set(walls.map((w) => w.id));

  if (wallIds.size !== walls.length) fail("duplicate wall ids");
  if (new Set(doors.map((d) => d.id)).size !== doors.length) fail("duplicate door ids");
  if (new Set(windows.map((w) => w.id)).size !== windows.length) fail("duplicate window ids");

  for (const w of walls) validateWall(w, storeyIds, familyIds);
  for (const d of doors) validateDoor(d, wallIds, doorFamilyIds);
  for (const w of windows) validateWindow(w, wallIds, windowFamilyIds);

  return {
    meta: {
      format: "axon",
      formatVersion: 1,
      name: data.meta.name,
      createdAt: data.meta.createdAt ?? new Date().toISOString(),
      updatedAt: data.meta.updatedAt ?? new Date().toISOString(),
    },
    storeys,
    families,
    doorFamilies,
    windowFamilies,
    walls,
    doors,
    windows,
  };
}
