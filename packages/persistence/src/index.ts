import type { AxonDocument, Door, Window } from "@axonbim/model";

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
  const data = JSON.parse(text) as Partial<AxonFileV1>;
  if (data.format !== "axon") {
    throw new Error('Invalid .axon file: format must be "axon"');
  }
  if (data.formatVersion !== 1) {
    throw new Error(`Unsupported .axon formatVersion: ${String(data.formatVersion)}`);
  }
  if (!data.meta?.name || !data.storeys?.length) {
    throw new Error("Invalid .axon file: missing meta or storeys");
  }
  return {
    meta: {
      format: "axon",
      formatVersion: 1,
      name: data.meta.name,
      createdAt: data.meta.createdAt,
      updatedAt: data.meta.updatedAt,
    },
    storeys: data.storeys,
    families: data.families ?? [],
    doorFamilies: data.doorFamilies?.length ? data.doorFamilies : [...DEFAULT_DOOR_FAMILIES],
    windowFamilies: data.windowFamilies?.length
      ? data.windowFamilies
      : [...DEFAULT_WINDOW_FAMILIES],
    walls: data.walls ?? [],
    doors: (data.doors ?? []).map((d) => ({
      ...d,
      leafState: d.leafState ?? "open",
      swing: d.swing ?? "positive",
      hinge: d.hinge ?? "start",
    })),
    windows: (data.windows ?? []).map((w) => ({
      ...w,
      leafState: w.leafState ?? "closed",
      swing: w.swing ?? "positive",
      hinge: w.hinge ?? "start",
      sill: w.sill ?? 0.9,
    })),
  };
}
