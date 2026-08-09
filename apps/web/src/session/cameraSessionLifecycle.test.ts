import { beforeEach, describe, expect, it } from "vitest";
import { serializeDocument } from "@axonbim/persistence";
import { useSessionStore } from "./createSessionStore";

function cameraTabs() {
  return useSessionStore.getState().views.filter((v) => v.kind === "camera");
}

function placeCamera(eye = { x: 0, y: 0 }, target = { x: 2, y: 0 }) {
  const s = useSessionStore.getState();
  s.setTool("camera");
  s.cameraClick({ x: eye.x, y: eye.y, z: 0 });
  s.cameraClick({ x: target.x, y: target.y, z: 0 });
}

describe("camera session lifecycle (F9-E4 policy A)", () => {
  beforeEach(() => {
    useSessionStore.getState().newProject();
  });

  it("create → undo drops the camera tab; redo restores it", () => {
    placeCamera();
    expect(useSessionStore.getState().document.cameras).toHaveLength(1);
    expect(cameraTabs()).toHaveLength(1);
    expect(cameraTabs()[0]?.name).toBe("Cámara 1");

    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.cameras).toHaveLength(0);
    expect(cameraTabs()).toHaveLength(0);

    useSessionStore.getState().runRedo();
    expect(useSessionStore.getState().document.cameras).toHaveLength(1);
    expect(cameraTabs()).toEqual([
      expect.objectContaining({
        id: "view.camera.camera.1",
        name: "Cámara 1",
        kind: "camera",
        cameraId: "camera.1",
      }),
    ]);
  });

  it("delete → undo restores the camera tab", () => {
    placeCamera();
    const id = useSessionStore.getState().document.cameras[0]!.id;
    useSessionStore.getState().setSelectedCameraId(id);
    useSessionStore.getState().deleteSelectedCamera();
    expect(cameraTabs()).toHaveLength(0);

    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.cameras).toHaveLength(1);
    expect(cameraTabs()).toHaveLength(1);
  });

  it("rename → undo restores the document name on the tab", () => {
    placeCamera();
    const id = useSessionStore.getState().document.cameras[0]!.id;
    useSessionStore.getState().setSelectedCameraId(id);
    useSessionStore.getState().setSelectedCameraName("Entrada");
    expect(cameraTabs()[0]?.name).toBe("Entrada");
    expect(useSessionStore.getState().document.cameras[0]?.name).toBe("Entrada");

    useSessionStore.getState().runUndo();
    expect(useSessionStore.getState().document.cameras[0]?.name).toBe("Cámara 1");
    expect(cameraTabs()[0]?.name).toBe("Cámara 1");
  });

  it("openFromText rebuilds camera tabs and drops previous project tabs", () => {
    placeCamera({ x: 1, y: 1 }, { x: 3, y: 1 });
    const withCam = serializeDocument(useSessionStore.getState().document);

    placeCamera({ x: 4, y: 4 }, { x: 6, y: 4 });
    expect(useSessionStore.getState().document.cameras).toHaveLength(2);
    expect(cameraTabs()).toHaveLength(2);

    useSessionStore.getState().openFromText(withCam, "a.axon");
    expect(useSessionStore.getState().document.cameras).toHaveLength(1);
    expect(cameraTabs()).toHaveLength(1);
    expect(cameraTabs()[0]?.cameraId).toBe(useSessionStore.getState().document.cameras[0]?.id);
    expect(useSessionStore.getState().activeViewId).toBe("view.plan.level1");
    expect(useSessionStore.getState().selectedCameraId).toBeNull();
  });
});
