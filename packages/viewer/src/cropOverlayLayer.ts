import type { ViewCrop } from "@axonbim/model";
import { viewCropCorners, viewCropPlanLines } from "@axonbim/model";
import {
  BufferAttribute,
  BufferGeometry,
  LineSegments,
  Mesh,
} from "three";
import {
  CROP_GRIP_RADIUS_PX,
  MIN_CROP_GRIP_RADIUS,
  screenScaledRadius,
} from "./pickTolerance.js";
import type { ViewportContext } from "./viewportContext.js";
import { applyViewCropClipping } from "./viewCropClip.js";
import {
  CAMERA_ID,
  CORNER,
  CROP_FRAME,
  CROP_GRIP,
} from "./viewportUserData.js";

export type CropOverlayLayer = {
  addCropOverlay: (
    crop: ViewCrop,
    selected: boolean,
    cameraId: string | null,
  ) => void;
  applyClippingState: () => void;
  setClippingCrop: (crop: ViewCrop | null) => void;
};

export function createCropOverlayLayer(ctx: ViewportContext): CropOverlayLayer {
  const { sg } = ctx;
  const {
    cropGroup,
    cropLineMat,
    cropLineSelectedMat,
    cropGripMat,
    flipSphereGeom,
    clipMats,
    cropMaskGroup,
    cropMaskMat,
  } = sg;

  const applyClippingState = () => {
    applyViewCropClipping({
      crop: ctx.currentClipCrop,
      renderer: ctx.renderer,
      materials: clipMats,
      planePool: ctx.clipPlanePool,
      maskGroup: cropMaskGroup,
      maskMaterial: cropMaskMat,
      isPlan: ctx.mode === "plan",
    });
  };

  const addCropOverlay = (
    crop: ViewCrop,
    selected: boolean,
    cameraId: string | null,
  ) => {
    if (!crop.enabled) return;
    // Above plan crop masks (z=12) so the frame stays visible
    const frameZ = 12.2;
    const geom = new BufferGeometry();
    geom.setAttribute(
      "position",
      new BufferAttribute(viewCropPlanLines(crop, frameZ), 3),
    );
    const lines = new LineSegments(
      geom,
      selected ? cropLineSelectedMat : cropLineMat,
    );
    if (cameraId) {
      lines.userData[CROP_FRAME] = true;
      lines.userData[CAMERA_ID] = cameraId;
    }
    cropGroup.add(lines);
    if (!selected) return;
    for (const c of viewCropCorners(crop, frameZ + 0.05)) {
      const grip = new Mesh(flipSphereGeom, cropGripMat);
      grip.position.set(c.x, c.y, c.z);
      const minR = screenScaledRadius(
        ctx.planWorldPerPixel(),
        CROP_GRIP_RADIUS_PX,
        MIN_CROP_GRIP_RADIUS,
      );
      grip.scale.setScalar(minR);
      grip.userData[CROP_GRIP] = true;
      grip.userData[CORNER] = c.corner;
      grip.userData[CAMERA_ID] = cameraId;
      cropGroup.add(grip);
    }
  };

  const setClippingCrop = (crop: ViewCrop | null) => {
    ctx.currentClipCrop = crop;
    applyClippingState();
  };

  return { addCropOverlay, applyClippingState, setClippingCrop };
}
