import { describe, expect, it } from "vitest";
import type { Camera } from "@axonbim/model";
import {
  cameraViewId,
  deriveCameraViews,
  mergeViewsWithDocument,
  patchViewsAfterDocumentChange,
  resolveActiveViewId,
  sessionOwnedViews,
} from "./cameraViews";
import type { ProjectView } from "./sessionTypes";

function cam(id: string, name: string): Camera {
  return {
    id,
    name,
    eye: { x: 0, y: 0, z: 1.7 },
    target: { x: 1, y: 0, z: 1.7 },
    fov: 45,
    crop: { enabled: false, minX: -1, minY: -1, maxX: 1, maxY: 1 },
  };
}

const plan: ProjectView = {
  id: "view.plan.level1",
  name: "Planta",
  kind: "plan",
  open: true,
  crop: { enabled: true, minX: 0, minY: 0, maxX: 1, maxY: 1 },
};

describe("cameraViews (F9-E4)", () => {
  it("derives one tab per camera and keeps session-owned crops", () => {
    const prev: ProjectView[] = [
      plan,
      {
        id: cameraViewId("camera.1"),
        name: "Old",
        kind: "camera",
        open: false,
        cameraId: "camera.1",
      },
    ];
    const merged = mergeViewsWithDocument(prev, [cam("camera.1", "Cámara 1"), cam("camera.2", "B")]);
    expect(sessionOwnedViews(merged)).toEqual([plan]);
    expect(merged.find((v) => v.cameraId === "camera.1")).toMatchObject({
      name: "Cámara 1",
      open: false,
    });
    expect(merged.filter((v) => v.kind === "camera")).toHaveLength(2);
  });

  it("drops orphan camera tabs and repairs activeViewId", () => {
    const views = deriveCameraViews([cam("camera.9", "X")], []);
    expect(resolveActiveViewId("view.camera.gone", [...sessionOwnedViews([plan]), ...views])).toBe(
      "view.plan.level1",
    );
    const patch = patchViewsAfterDocumentChange(
      [
        plan,
        {
          id: "view.camera.orphan",
          name: "Huérfana",
          kind: "camera",
          open: true,
          cameraId: "camera.gone",
        },
      ],
      "view.camera.orphan",
      [],
    );
    expect(patch.views.filter((v) => v.kind === "camera")).toHaveLength(0);
    expect(patch.activeViewId).toBe("view.plan.level1");
  });
});
