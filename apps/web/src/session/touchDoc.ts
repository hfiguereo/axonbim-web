import type { AxonDocument } from "@axonbim/model";

/**
 * Shallow clone so React/zustand see a new document reference after in-place
 * command mutation. Does not deep-clone entities (same as prior sessionStore).
 */
export function touchDoc(doc: AxonDocument): AxonDocument {
  return {
    ...doc,
    walls: [...doc.walls],
    doors: [...doc.doors],
    windows: [...doc.windows],
    cameras: [...doc.cameras],
    storeys: [...doc.storeys],
    families: [...doc.families],
    doorFamilies: [...doc.doorFamilies],
    windowFamilies: [...doc.windowFamilies],
    meta: { ...doc.meta },
    presentation: doc.presentation
      ? { viewCrops: { ...doc.presentation.viewCrops } }
      : doc.presentation,
  };
}
