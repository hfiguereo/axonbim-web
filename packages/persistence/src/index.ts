import type {
  AxonDocument,
  Camera,
  Door,
  DocumentRefs,
  ValidationResult,
  ViewCrop,
  Wall,
  Window,
} from "@axonbim/model";
import {
  defaultCameraCrop,
  normalizeViewCrop,
  validateCamera,
  validateDoor,
  validateWall,
  validateWindow,
} from "@axonbim/model";

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
  cameras?: Camera[];
};

function fail(msg: string): never {
  throw new Error(`Invalid .axon file: ${msg}`);
}

/**
 * Entity rules live in `@axonbim/model` (ADR 0017), shared with the commands.
 * What stays here is the file-format frontier: format, structure, duplicates.
 * Full runtime shape validation of the JSON is F9-E5.
 */
function check(issue: ValidationResult): void {
  if (issue) fail(issue.message);
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
    cameras: doc.cameras ?? [],
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
  const cameras = (data.cameras ?? []).map((c) => {
    const fov = c.fov ?? 45;
    const eye = c.eye;
    const target = c.target;
    const crop =
      c.crop && typeof c.crop === "object"
        ? normalizeViewCrop(c.crop as ViewCrop)
        : defaultCameraCrop(eye, target, fov);
    return {
      ...c,
      fov,
      crop,
    };
  }) as Camera[];

  const storeyIds = new Set(storeys.map((s) => s.id));
  const familyIds = new Set(families.map((f) => f.id));
  const doorFamilyIds = new Set(doorFamilies.map((f) => f.id));
  const windowFamilyIds = new Set(windowFamilies.map((f) => f.id));
  const wallIds = new Set(walls.map((w) => w.id));

  if (wallIds.size !== walls.length) fail("duplicate wall ids");
  if (new Set(doors.map((d) => d.id)).size !== doors.length) fail("duplicate door ids");
  if (new Set(windows.map((w) => w.id)).size !== windows.length) fail("duplicate window ids");
  if (new Set(cameras.map((c) => c.id)).size !== cameras.length) fail("duplicate camera ids");

  const refs: DocumentRefs = {
    storeyIds,
    wallFamilyIds: familyIds,
    doorFamilyIds,
    windowFamilyIds,
    wallIds,
  };
  for (const w of walls) check(validateWall(w, refs));
  for (const d of doors) check(validateDoor(d, refs));
  for (const w of windows) check(validateWindow(w, refs));
  for (const c of cameras) check(validateCamera(c));

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
    cameras,
  };
}
