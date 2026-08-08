import type { ProjectView } from "./sessionTypes";

/** Default open views for a new / demo / reset project (session UI only). */
export function defaultViews(): ProjectView[] {
  return [
    { id: "view.plan.level1", name: "Planta Nivel 1", kind: "plan", open: true },
    {
      id: "view.3d.perspective",
      name: "Perspectiva 3D",
      kind: "perspective",
      open: true,
    },
  ];
}
