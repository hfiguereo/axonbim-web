import type { AxonDocument, Storey } from "./types.js";

/**
 * LR3-A — resolve the active storey without tools reading `storeys[0]` directly.
 * Session holds `activeStoreyId`; this module is the single resolver.
 */

/** Pick a valid storey id; never leaves an unknown id active. */
export function reconcileActiveStoreyId(
  document: AxonDocument,
  preferredId: string | null | undefined,
): string {
  const storeys = document.storeys;
  if (storeys.length === 0) {
    return "storey.default";
  }
  if (preferredId && storeys.some((s) => s.id === preferredId)) {
    return preferredId;
  }
  return storeys[0]!.id;
}

export function getActiveStorey(
  document: AxonDocument,
  activeStoreyId: string | null | undefined,
): Storey {
  const id = reconcileActiveStoreyId(document, activeStoreyId);
  const found = document.storeys.find((s) => s.id === id);
  if (found) return found;
  // Document with zero storeys (should not happen after parse) — synthetic fallback.
  return { id: "storey.default", name: "Nivel 1", elevation: 0 };
}

export function getActiveStoreyElevation(
  document: AxonDocument,
  activeStoreyId: string | null | undefined,
): number {
  return getActiveStorey(document, activeStoreyId).elevation;
}
