/**
 * Draft → commit helpers for Propiedades number fields (BUG-UI-NUM).
 * Empty / incomplete drafts do not commit; blur reverts to the last committed value.
 */

export function formatPropsNumber(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(value);
}

/** Incomplete while typing (allow clearing / "0." / "-"). */
export function isIncompleteNumberDraft(raw: string): boolean {
  const t = raw.trim();
  if (t === "" || t === "-" || t === "." || t === "-.") return true;
  if (t.endsWith(".")) return true;
  return false;
}

export type PropsNumberCommitOpts = {
  min?: number;
  max?: number;
  /** Default true — reject 0 and negatives unless min allows them. */
  requirePositive?: boolean;
};

export function parsePropsNumberDraft(
  raw: string,
  opts: PropsNumberCommitOpts = {},
): number | null {
  if (isIncompleteNumberDraft(raw)) return null;
  const v = Number(raw.trim());
  if (!Number.isFinite(v)) return null;
  if (opts.requirePositive !== false && !(v > 0)) return null;
  if (opts.min != null && v < opts.min) return null;
  if (opts.max != null && v > opts.max) return null;
  return v;
}
