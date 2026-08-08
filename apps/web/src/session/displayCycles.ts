import type { DetailLevel, VisualStyle } from "./sessionTypes";

export const GRAPHIC_SCALES = ["1:20", "1:50", "1:100", "1:200"] as const;
export type GraphicScale = (typeof GRAPHIC_SCALES)[number];

export const VISUAL_STYLES: VisualStyle[] = ["wireframe", "hiddenLine", "shaded"];
export const DETAIL_LEVELS: DetailLevel[] = ["coarse", "medium", "fine"];

function nextInList<T>(list: readonly T[], current: T): T {
  const i = list.indexOf(current);
  return list[(i + 1) % list.length] ?? list[0]!;
}

/** Next graphic scale label (status / UI cycle). */
export function nextGraphicScale(current: string): GraphicScale {
  const i = GRAPHIC_SCALES.indexOf(current as GraphicScale);
  return GRAPHIC_SCALES[(i + 1) % GRAPHIC_SCALES.length] ?? GRAPHIC_SCALES[0];
}

export function nextVisualStyle(current: VisualStyle): VisualStyle {
  return nextInList(VISUAL_STYLES, current);
}

export function nextDetailLevel(current: DetailLevel): DetailLevel {
  return nextInList(DETAIL_LEVELS, current);
}
