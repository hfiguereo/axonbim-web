/** Built-in wall + door families. */

export type WallFamily = {
  id: string;
  label: string;
  thickness: number;
};

export type DoorFamily = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export const BUILTIN_WALL_FAMILIES: readonly WallFamily[] = [
  { id: "family.light-100", label: "Muro ligero", thickness: 0.1 },
  { id: "family.block-150", label: "Bloque 150", thickness: 0.15 },
  { id: "family.block-200", label: "Bloque 200", thickness: 0.2 },
] as const;

export const BUILTIN_DOOR_FAMILIES: readonly DoorFamily[] = [
  { id: "family.door-80", label: "Puerta 80", width: 0.8, height: 2.1 },
  { id: "family.door-90", label: "Puerta 90", width: 0.9, height: 2.1 },
  { id: "family.door-100", label: "Puerta 100", width: 1.0, height: 2.1 },
] as const;

export function familyById(id: string): WallFamily | undefined {
  return BUILTIN_WALL_FAMILIES.find((f) => f.id === id);
}

export function doorFamilyById(id: string): DoorFamily | undefined {
  return BUILTIN_DOOR_FAMILIES.find((f) => f.id === id);
}
