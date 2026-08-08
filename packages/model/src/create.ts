import {
  BUILTIN_DOOR_FAMILIES,
  BUILTIN_WALL_FAMILIES,
  BUILTIN_WINDOW_FAMILIES,
} from "@axonbim/families";
import type { AxonDocument, Wall } from "./types.js";

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
    doorFamilies: [...BUILTIN_DOOR_FAMILIES],
    windowFamilies: [...BUILTIN_WINDOW_FAMILIES],
    walls: [],
    doors: [],
    windows: [],
  };
}

/** Small rectangular house footprint (8×6 m) + one partition — MVP demo. */
export function createDemoDocument(): AxonDocument {
  const doc = createEmptyDocument("Vivienda demo");
  const now = isoNow();
  doc.meta.updatedAt = now;
  const storeyId = "storey.default";
  const familyId = "family.block-150";
  const height = 2.7;
  const thickness = 0.15;
  const z = 0;

  const segs: [number, number, number, number][] = [
    [0, 0, 8, 0],
    [8, 0, 8, 6],
    [8, 6, 0, 6],
    [0, 6, 0, 0],
    [4, 0, 4, 6],
  ];

  doc.walls = segs.map(([x1, y1, x2, y2], i): Wall => ({
    id: `wall.demo.${i + 1}`,
    storeyId,
    familyId,
    p1: { x: x1, y: y1, z },
    p2: { x: x2, y: y2, z },
    height,
    thickness,
  }));

  return doc;
}
