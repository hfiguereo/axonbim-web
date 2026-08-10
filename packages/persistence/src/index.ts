import type { AxonDocument } from "@axonbim/model";
import { wallToFileJson } from "./shape.js";

export type { AxonFile, AxonFileV1 } from "./shape.js";
export type { RecoverResult } from "./parse.js";
export { parseDocument, parseDocumentRecover } from "./parse.js";
export {
  MAX_AXON_TEXT_BYTES,
  MAX_CAMERAS,
  MAX_DOORS,
  MAX_STOREYS,
  MAX_WALLS,
  MAX_WINDOWS,
} from "./limits.js";

export function serializeDocument(doc: AxonDocument): string {
  const viewCrops = doc.presentation?.viewCrops ?? {};
  const enabledCrops = Object.fromEntries(
    Object.entries(viewCrops).filter(([, crop]) => crop.enabled),
  );
  const file = {
    format: "axon" as const,
    formatVersion: 2 as const,
    meta: {
      name: doc.meta.name,
      createdAt: doc.meta.createdAt,
      updatedAt: doc.meta.updatedAt,
    },
    storeys: doc.storeys,
    families: doc.families,
    doorFamilies: doc.doorFamilies,
    windowFamilies: doc.windowFamilies,
    walls: doc.walls.map(wallToFileJson),
    doors: doc.doors,
    windows: doc.windows,
    cameras: doc.cameras ?? [],
    ...(Object.keys(enabledCrops).length > 0
      ? { presentation: { viewCrops: enabledCrops } }
      : {}),
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}
