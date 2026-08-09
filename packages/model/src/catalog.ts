/**
 * Document family catalogs (F9-E3 / ADR 0017 policy A).
 *
 * The built-ins in `@axonbim/families` seed new/demo documents. After load, the
 * source of truth is `document.families` / `doorFamilies` / `windowFamilies`.
 */
import type { DoorFamily, WallFamily, WindowFamily } from "@axonbim/families";
import type { AxonDocument } from "./types.js";

export function findWallFamily(
  families: readonly WallFamily[],
  id: string,
): WallFamily | undefined {
  return families.find((f) => f.id === id);
}

export function findDoorFamily(
  families: readonly DoorFamily[],
  id: string,
): DoorFamily | undefined {
  return families.find((f) => f.id === id);
}

export function findWindowFamily(
  families: readonly WindowFamily[],
  id: string,
): WindowFamily | undefined {
  return families.find((f) => f.id === id);
}

/**
 * Keep `preferred` if it exists in the catalog; otherwise the first entry.
 * Returns `preferred` unchanged when the catalog is empty (should not happen
 * for documents created by `createEmptyDocument` / valid `.axon` files).
 */
export function pickCatalogId(
  catalog: readonly { id: string }[],
  preferred: string,
): string {
  if (catalog.some((f) => f.id === preferred)) return preferred;
  return catalog[0]?.id ?? preferred;
}

export type ActiveFamilyIds = {
  activeFamilyId: string;
  activeDoorFamilyId: string;
  activeWindowFamilyId: string;
};

/** Align session active-family IDs with the catalogs of a loaded document. */
export function reconcileActiveFamilyIds(
  doc: AxonDocument,
  preferred: ActiveFamilyIds,
): ActiveFamilyIds {
  return {
    activeFamilyId: pickCatalogId(doc.families, preferred.activeFamilyId),
    activeDoorFamilyId: pickCatalogId(doc.doorFamilies, preferred.activeDoorFamilyId),
    activeWindowFamilyId: pickCatalogId(
      doc.windowFamilies,
      preferred.activeWindowFamilyId,
    ),
  };
}
