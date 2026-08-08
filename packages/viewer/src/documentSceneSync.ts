import {
  computeWallJoinDirs,
  doorAssemblyMeshes,
  doorPlanSymbol,
  openingsFromHosted,
  wallMeshWithOpenings,
  windowAssemblyMeshes,
  windowPlanSymbol,
  cameraPlanSymbol,
  cameraVisionConeLines,
  type MeshBuffer,
} from "@axonbim/geometry";
import type { Camera, Door, ViewCrop, Wall, Window } from "@axonbim/model";
import {
  BufferAttribute,
  BufferGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
} from "three";
import type { CropOverlayLayer } from "./cropOverlayLayer.js";
import {
  CAMERA_PICK_RADIUS_PX,
  FLIP_CONTROL_RADIUS_PX,
  MAX_FLIP_CONTROL_RADIUS,
  MIN_CAMERA_PICK_RADIUS,
  screenScaledRadius,
} from "./pickTolerance.js";
import type { ViewportContext } from "./viewportContext.js";
import { meshFromBuffer } from "./viewportSceneGraph.js";
import {
  CAMERA_ID,
  DOOR_ID,
  ENTITY_ID,
  ENTITY_TYPE,
  FLIP_CONTROL,
  KIND,
  WALL_ID,
  WINDOW_ID,
} from "./viewportUserData.js";

export type DocumentSceneSync = {
  syncWalls: (
    walls: Wall[],
    doors: Door[],
    windows: Window[],
    cameras: Camera[],
    selectedWallId: string | null,
    selectedDoorId: string | null,
    selectedWindowId: string | null,
    selectedCameraId: string | null,
    sessionCrop?: ViewCrop | null,
    selectedCropFrameCameraId?: string | null,
  ) => void;
  setPreviewSegment: (
    p1: { x: number; y: number; z: number } | null,
    p2: { x: number; y: number; z: number } | null,
  ) => void;
  setSnapCue: (
    point: { x: number; y: number; z: number } | null,
    kind: "none" | "endpoint" | "ortho" | "close",
    pending?: { x: number; y: number; z: number } | null,
  ) => void;
  disposeOverlays: () => void;
};

export function createDocumentSceneSync(
  ctx: ViewportContext,
  cropLayer: CropOverlayLayer,
): DocumentSceneSync {
  const { scene } = ctx.sg;
  const {
    wallsGroup,
    doorsGroup,
    windowsGroup,
    planDoorsGroup,
    flipControlsGroup,
    camerasGroup,
    cropGroup,
    wallMat,
    wallSelectedMat,
    doorMat,
    doorSelectedMat,
    doorFrameMat,
    doorFrameSelectedMat,
    doorHardwareMat,
    doorHardwareSelectedMat,
    windowFrameMat,
    windowFrameSelectedMat,
    windowSashMat,
    windowSashSelectedMat,
    windowGlassMat,
    windowGlassSelectedMat,
    cameraLineMat,
    cameraLineSelectedMat,
    cameraConeSelectedMat,
    cameraPickGeom,
    cameraPickMat,
    cameraPickSelectedMat,
    planDoorLineMat,
    planDoorLineSelectedMat,
    flipSwingMat,
    flipHingeMat,
    flipSphereGeom,
  } = ctx.sg;

  const previewGeom = new BufferGeometry();
  previewGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(6), 3),
  );
  const previewMat = new LineBasicMaterial({ color: 0xd4a15a });
  const previewLine = new LineSegments(previewGeom, previewMat);
  previewLine.visible = false;
  scene.add(previewLine);

  const snapMarkerGeom = new BufferGeometry();
  snapMarkerGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(12), 3),
  );
  const snapMarkerMat = new LineBasicMaterial({ color: 0x5ec8ff });
  const snapMarker = new LineSegments(snapMarkerGeom, snapMarkerMat);
  snapMarker.visible = false;
  scene.add(snapMarker);

  const snapGuideGeom = new BufferGeometry();
  snapGuideGeom.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(6), 3),
  );
  const snapGuideMat = new LineBasicMaterial({ color: 0x5ec8ff });
  const snapGuide = new LineSegments(snapGuideGeom, snapGuideMat);
  snapGuide.visible = false;
  scene.add(snapGuide);

  const snapColors: Record<"none" | "endpoint" | "ortho" | "close", number> = {
    none: 0xb0b8c0,
    endpoint: 0x5ec8ff,
    ortho: 0x7dd87d,
    close: 0xe8b84a,
  };

  const clearGroup = (group: typeof wallsGroup, disposeGeometry: boolean) => {
    while (group.children.length) {
      const child = group.children[0]!;
      group.remove(child);
      if (disposeGeometry && child instanceof Mesh) child.geometry.dispose();
      if (disposeGeometry && child instanceof LineSegments) child.geometry.dispose();
    }
  };

  const syncWalls = (
    walls: Wall[],
    doors: Door[],
    windows: Window[],
    cameras: Camera[],
    selectedWallId: string | null,
    selectedDoorId: string | null,
    selectedWindowId: string | null,
    selectedCameraId: string | null,
    sessionCrop: ViewCrop | null = null,
    selectedCropFrameCameraId: string | null = null,
  ) => {
    clearGroup(wallsGroup, true);
    clearGroup(doorsGroup, true);
    clearGroup(windowsGroup, true);
    clearGroup(planDoorsGroup, true);
    while (flipControlsGroup.children.length) {
      flipControlsGroup.remove(flipControlsGroup.children[0]!);
    }
    while (camerasGroup.children.length) {
      const child = camerasGroup.children[0]!;
      camerasGroup.remove(child);
      if (child instanceof LineSegments || child instanceof Mesh) {
        child.geometry.dispose();
      }
    }
    while (cropGroup.children.length) {
      const child = cropGroup.children[0]!;
      cropGroup.remove(child);
      if (child instanceof LineSegments || child instanceof Mesh) {
        child.geometry.dispose();
      }
    }

    const joins = computeWallJoinDirs(walls);
    for (const wall of walls) {
      const j = joins.get(wall.id);
      const openings = openingsFromHosted(wall.id, doors, windows);
      const buffer = wallMeshWithOpenings(
        wall,
        openings,
        openings.length
          ? undefined
          : {
              joinStartAway: j?.startAway ?? null,
              joinEndAway: j?.endAway ?? null,
            },
      );
      if (buffer.positions.length === 0) continue;
      const mesh = new Mesh(
        meshFromBuffer(buffer),
        wall.id === selectedWallId ? wallSelectedMat : wallMat,
      );
      mesh.userData[WALL_ID] = wall.id;
      wallsGroup.add(mesh);
    }
    for (const door of doors) {
      const host = walls.find((w) => w.id === door.wallId);
      if (!host) continue;
      const selected = door.id === selectedDoorId;
      const parts = doorAssemblyMeshes(host, door);
      const addPart = (buffer: MeshBuffer, mat: MeshLambertMaterial) => {
        if (buffer.positions.length === 0) return;
        const mesh = new Mesh(meshFromBuffer(buffer), mat);
        mesh.userData[DOOR_ID] = door.id;
        doorsGroup.add(mesh);
      };
      addPart(parts.frame, selected ? doorFrameSelectedMat : doorFrameMat);
      addPart(parts.leaf, selected ? doorSelectedMat : doorMat);
      addPart(parts.hardware, selected ? doorHardwareSelectedMat : doorHardwareMat);

      const symbol = doorPlanSymbol(host, door);
      if (symbol) {
        const geom = new BufferGeometry();
        geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
        const lines = new LineSegments(
          geom,
          selected ? planDoorLineSelectedMat : planDoorLineMat,
        );
        lines.userData[DOOR_ID] = door.id;
        planDoorsGroup.add(lines);

        if (selected) {
          for (const ctrl of symbol.flipControls) {
            const grip = new Mesh(
              flipSphereGeom,
              ctrl.kind === "swing" ? flipSwingMat : flipHingeMat,
            );
            grip.position.set(ctrl.x, ctrl.y, ctrl.z);
            const minR = screenScaledRadius(
              ctx.planWorldPerPixel(),
              FLIP_CONTROL_RADIUS_PX,
              ctrl.hitRadius,
              MAX_FLIP_CONTROL_RADIUS,
            );
            grip.scale.setScalar(minR);
            grip.userData[FLIP_CONTROL] = true;
            grip.userData[ENTITY_TYPE] = ctrl.entityType;
            grip.userData[ENTITY_ID] = ctrl.entityId;
            grip.userData[KIND] = ctrl.kind;
            flipControlsGroup.add(grip);
          }
        }
      }
    }
    for (const win of windows) {
      const host = walls.find((w) => w.id === win.wallId);
      if (!host) continue;
      const selected = win.id === selectedWindowId;
      const parts = windowAssemblyMeshes(host, win);
      const addPart = (buffer: MeshBuffer, mat: MeshLambertMaterial) => {
        if (buffer.positions.length === 0) return;
        const mesh = new Mesh(meshFromBuffer(buffer), mat);
        mesh.userData[WINDOW_ID] = win.id;
        windowsGroup.add(mesh);
      };
      addPart(parts.frame, selected ? windowFrameSelectedMat : windowFrameMat);
      addPart(parts.sash, selected ? windowSashSelectedMat : windowSashMat);
      addPart(parts.glass, selected ? windowGlassSelectedMat : windowGlassMat);

      const symbol = windowPlanSymbol(host, win);
      if (symbol) {
        const geom = new BufferGeometry();
        geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
        const lines = new LineSegments(
          geom,
          selected ? planDoorLineSelectedMat : planDoorLineMat,
        );
        lines.userData[WINDOW_ID] = win.id;
        planDoorsGroup.add(lines);

        if (selected) {
          for (const ctrl of symbol.flipControls) {
            const grip = new Mesh(
              flipSphereGeom,
              ctrl.kind === "swing" ? flipSwingMat : flipHingeMat,
            );
            grip.position.set(ctrl.x, ctrl.y, ctrl.z);
            const minR = screenScaledRadius(
              ctx.planWorldPerPixel(),
              FLIP_CONTROL_RADIUS_PX,
              ctrl.hitRadius,
              MAX_FLIP_CONTROL_RADIUS,
            );
            grip.scale.setScalar(minR);
            grip.userData[FLIP_CONTROL] = true;
            grip.userData[ENTITY_TYPE] = ctrl.entityType;
            grip.userData[ENTITY_ID] = ctrl.entityId;
            grip.userData[KIND] = ctrl.kind;
            flipControlsGroup.add(grip);
          }
        }
      }
    }
    for (const cam of cameras) {
      const selected = cam.id === selectedCameraId;
      const symbol = cameraPlanSymbol(cam);
      const geom = new BufferGeometry();
      geom.setAttribute("position", new BufferAttribute(symbol.lines, 3));
      const lines = new LineSegments(
        geom,
        selected ? cameraLineSelectedMat : cameraLineMat,
      );
      lines.userData[CAMERA_ID] = cam.id;
      camerasGroup.add(lines);

      // Plan: cone + crop frame when camera selected; grips when frame selected
      if (selected && cam.crop?.enabled) {
        const coneGeom = new BufferGeometry();
        coneGeom.setAttribute(
          "position",
          new BufferAttribute(cameraVisionConeLines(cam), 3),
        );
        const cone = new LineSegments(coneGeom, cameraConeSelectedMat);
        cone.userData[CAMERA_ID] = cam.id;
        camerasGroup.add(cone);

        const frameSelected = selectedCropFrameCameraId === cam.id;
        cropLayer.addCropOverlay(cam.crop, frameSelected, cam.id);
      }

      const pick = new Mesh(
        cameraPickGeom,
        selected ? cameraPickSelectedMat : cameraPickMat,
      );
      pick.position.set(symbol.pick.x, symbol.pick.y, symbol.pick.z);
      const r = screenScaledRadius(
        ctx.planWorldPerPixel(),
        CAMERA_PICK_RADIUS_PX,
        MIN_CAMERA_PICK_RADIUS,
      );
      pick.scale.setScalar(r);
      pick.userData[CAMERA_ID] = cam.id;
      camerasGroup.add(pick);
    }
    // Independent plan/presentation crop (clips geometry only via getClippingCrop)
    if (sessionCrop?.enabled) {
      cropLayer.addCropOverlay(
        sessionCrop,
        !selectedCameraId && !selectedCropFrameCameraId,
        null,
      );
    }
  };

  const setPreviewSegment = (
    p1: { x: number; y: number; z: number } | null,
    p2: { x: number; y: number; z: number } | null,
  ) => {
    if (!p1 || !p2) {
      previewLine.visible = false;
      return;
    }
    const arr = previewGeom.getAttribute("position") as BufferAttribute;
    arr.setXYZ(0, p1.x, p1.y, p1.z + 0.05);
    arr.setXYZ(1, p2.x, p2.y, p2.z + 0.05);
    arr.needsUpdate = true;
    previewLine.visible = true;
  };

  const setSnapCue = (
    point: { x: number; y: number; z: number } | null,
    kind: "none" | "endpoint" | "ortho" | "close",
    pending: { x: number; y: number; z: number } | null = null,
  ) => {
    if (!point || kind === "none") {
      // Still show a faint cursor mark when free-drawing with pending
      if (point && pending) {
        const s = 0.12;
        const z = point.z + 0.08;
        const arr = snapMarkerGeom.getAttribute("position") as BufferAttribute;
        arr.setXYZ(0, point.x - s, point.y, z);
        arr.setXYZ(1, point.x + s, point.y, z);
        arr.setXYZ(2, point.x, point.y - s, z);
        arr.setXYZ(3, point.x, point.y + s, z);
        arr.needsUpdate = true;
        snapMarkerMat.color.setHex(snapColors.none);
        snapMarker.visible = true;
        snapGuide.visible = false;
        previewMat.color.setHex(0xb0b8c0);
        return;
      }
      snapMarker.visible = false;
      snapGuide.visible = false;
      previewMat.color.setHex(0xd4a15a);
      return;
    }

    const s = kind === "close" || kind === "endpoint" ? 0.22 : 0.16;
    const z = point.z + 0.08;
    const arr = snapMarkerGeom.getAttribute("position") as BufferAttribute;
    arr.setXYZ(0, point.x - s, point.y, z);
    arr.setXYZ(1, point.x + s, point.y, z);
    arr.setXYZ(2, point.x, point.y - s, z);
    arr.setXYZ(3, point.x, point.y + s, z);
    arr.needsUpdate = true;
    snapMarkerMat.color.setHex(snapColors[kind]);
    snapMarker.visible = true;
    previewMat.color.setHex(snapColors[kind]);

    if (pending && (kind === "ortho" || kind === "close")) {
      const g = snapGuideGeom.getAttribute("position") as BufferAttribute;
      g.setXYZ(0, pending.x, pending.y, pending.z + 0.04);
      g.setXYZ(1, point.x, point.y, point.z + 0.04);
      g.needsUpdate = true;
      snapGuideMat.color.setHex(snapColors[kind]);
      snapGuide.visible = true;
    } else {
      snapGuide.visible = false;
    }
  };

  const disposeOverlays = () => {
    previewGeom.dispose();
    previewMat.dispose();
    snapMarkerGeom.dispose();
    snapMarkerMat.dispose();
    snapGuideGeom.dispose();
    snapGuideMat.dispose();
  };

  return {
    syncWalls,
    setPreviewSegment,
    setSnapCue,
    disposeOverlays,
  };
}
