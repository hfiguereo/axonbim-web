/** Built-in wall families for the MVP catalog. */

export type WallFamily = {
  id: string;
  label: string;
  thickness: number;
};

export const BUILTIN_WALL_FAMILIES: readonly WallFamily[] = [
  { id: "family.light-100", label: "Muro ligero", thickness: 0.1 },
  { id: "family.block-150", label: "Bloque 150", thickness: 0.15 },
  { id: "family.block-200", label: "Bloque 200", thickness: 0.2 },
] as const;

export function familyById(id: string): WallFamily | undefined {
  return BUILTIN_WALL_FAMILIES.find((f) => f.id === id);
}
