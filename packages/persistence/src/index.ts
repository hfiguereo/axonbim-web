import type { AxonDocument, Door } from "@axonbim/model";

const DEFAULT_DOOR_FAMILIES: AxonDocument["doorFamilies"] = [
  { id: "family.door-80", label: "Puerta 80", width: 0.8, height: 2.1 },
  { id: "family.door-90", label: "Puerta 90", width: 0.9, height: 2.1 },
  { id: "family.door-100", label: "Puerta 100", width: 1.0, height: 2.1 },
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
  walls: AxonDocument["walls"];
  doors?: Door[];
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
    walls: doc.walls,
    doors: doc.doors,
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
    walls: data.walls ?? [],
    doors: (data.doors ?? []).map((d) => ({
      ...d,
      leafState: d.leafState ?? "open",
      swing: d.swing ?? "positive",
      hinge: d.hinge ?? "start",
    })),
  };
}
