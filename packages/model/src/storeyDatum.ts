import type { AxonDocument, Storey } from "./types.js";
import { reconcileActiveStoreyId } from "./activeStorey.js";

/**
 * LR3-B — derived visual/spatial datum for a storey.
 * Not a second source of truth: always rebuilt from `document.storeys` + active id.
 */
export type StoreyDatum = {
  id: string;
  name: string;
  elevation: number;
  active: boolean;
};

export function storeyToDatum(storey: Storey, activeStoreyId: string): StoreyDatum {
  return {
    id: storey.id,
    name: storey.name,
    elevation: storey.elevation,
    active: storey.id === activeStoreyId,
  };
}

/** Derived list for UI / future workplanes — never persist as SoT. */
export function deriveStoreyDatums(
  document: AxonDocument,
  activeStoreyId: string | null | undefined,
): StoreyDatum[] {
  const activeId = reconcileActiveStoreyId(document, activeStoreyId);
  return document.storeys.map((s) => storeyToDatum(s, activeId));
}
