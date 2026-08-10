/**
 * H4 — status when a viewport click misses the active Workplane (ray ‖ plane / behind).
 * Avoid silent no-ops that look like broken Modificar / sketch tools.
 */
export const WORKPLANE_PICK_MISS_STATUS =
  "Sin intersección con el Workplane — órbita menos rasante a la cara o acerca el clic al plano";

/** Whether a missed workplane pick should surface status (vs ignore). */
export function shouldReportWorkplanePickMiss(opts: {
  sketchTarget: boolean;
  sketchModifyLive: boolean;
  activeTool: string;
}): boolean {
  if (opts.sketchModifyLive || opts.sketchTarget) return true;
  return (
    opts.activeTool === "wall" ||
    opts.activeTool === "workplaneLine" ||
    opts.activeTool === "workplaneSelect"
  );
}
