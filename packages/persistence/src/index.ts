import type { AxonDocument } from "@axonbim/model";

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
  walls: AxonDocument["walls"];
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
    walls: doc.walls,
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
    walls: data.walls ?? [],
  };
}
