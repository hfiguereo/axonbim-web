import { BUILTIN_WALL_FAMILIES } from "@axonbim/families";
import type { AxonDocument } from "./types.js";

function isoNow(): string {
  return new Date().toISOString();
}

export function createEmptyDocument(name = "Sin título"): AxonDocument {
  const now = isoNow();
  return {
    meta: {
      format: "axon",
      formatVersion: 1,
      name,
      createdAt: now,
      updatedAt: now,
    },
    storeys: [{ id: "storey.default", name: "Nivel 1", elevation: 0 }],
    families: [...BUILTIN_WALL_FAMILIES],
    walls: [],
  };
}

/** Demo house footprint — walls arrive in Etapa 1+; Etapa 0 ships empty named demo. */
export function createDemoDocument(): AxonDocument {
  const doc = createEmptyDocument("Vivienda demo");
  doc.meta.updatedAt = isoNow();
  return doc;
}
