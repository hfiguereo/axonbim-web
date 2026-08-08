/** Reusable plan orientation grips — doors, windows, future hosted elements. */
export type PlanFlipControl = {
  entityType: "door" | "window";
  entityId: string;
  kind: "swing" | "hinge";
  x: number;
  y: number;
  z: number;
  hitRadius: number;
};
