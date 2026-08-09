import { describe, expect, it } from "vitest";
import {
  buildCameraCropScreenFrame,
  CAMERA_CROP_FRAME_INSET,
  oppositeCropCorner,
  projectCropToHostRect,
  rectCornerGrips,
  resizeCropFromScreenRectCorner,
  scaleScreenFrameToWorldSize,
  screenFrameFromCornerDrag,
} from "./cropScreenFrame";

describe("buildCameraCropScreenFrame", () => {
  it("uses fixed inset matte, not projected AABB size", () => {
    const host = { left: 100, top: 50, width: 800, height: 600 };
    const project = (x: number, y: number, _z: number) => ({
      x: host.left + (x + 10) * 20,
      y: host.top + (10 - y) * 20,
      behind: false,
    });
    const frame = buildCameraCropScreenFrame(
      { enabled: true, minX: 0, minY: 0, maxX: 4, maxY: 2 },
      0,
      project,
      host,
    );
    expect(frame).not.toBeNull();
    expect(frame!.left).toBeCloseTo(host.width * CAMERA_CROP_FRAME_INSET);
    expect(frame!.top).toBeCloseTo(host.height * CAMERA_CROP_FRAME_INSET);
    expect(frame!.width).toBeCloseTo(host.width * (1 - 2 * CAMERA_CROP_FRAME_INSET));
    expect(frame!.height).toBeCloseTo(host.height * (1 - 2 * CAMERA_CROP_FRAME_INSET));
    expect(frame!.corners).toHaveLength(4);
  });
});

describe("projectCropToHostRect", () => {
  it("builds AABB from projected corners (not used for camera matte)", () => {
    const host = { left: 100, top: 50, width: 800, height: 600 };
    const project = (x: number, y: number, _z: number) => ({
      x: host.left + (x + 10) * 20,
      y: host.top + (10 - y) * 20,
      behind: false,
    });
    const frame = projectCropToHostRect(
      { enabled: true, minX: 0, minY: 0, maxX: 4, maxY: 2 },
      0,
      project,
      host,
    );
    expect(frame).not.toBeNull();
    expect(frame!.width).toBeCloseTo(80);
    expect(frame!.height).toBeCloseTo(40);
  });
});

describe("rectCornerGrips", () => {
  it("pairs screen diagonals to world opposites", () => {
    const grips = rectCornerGrips(
      [
        { corner: 0, left: 5, top: 95 },
        { corner: 1, left: 95, top: 95 },
        { corner: 2, left: 95, top: 5 },
        { corner: 3, left: 5, top: 5 },
      ],
      100,
      100,
    );
    const byPos = Object.fromEntries(grips.map((g) => [`${g.left},${g.top}`, g.corner]));
    expect(oppositeCropCorner(byPos["0,0"]!)).toBe(byPos["100,100"]!);
    expect(oppositeCropCorner(byPos["100,0"]!)).toBe(byPos["0,100"]!);
  });
});

describe("screenFrameFromCornerDrag", () => {
  it("resizes the CSS rect with the dragged corner", () => {
    const host = { left: 0, top: 0, width: 800, height: 600 };
    const prev = {
      left: 64,
      top: 48,
      width: 672,
      height: 504,
      corners: [
        { corner: 3 as const, left: 0, top: 0 },
        { corner: 2 as const, left: 672, top: 0 },
        { corner: 1 as const, left: 672, top: 504 },
        { corner: 0 as const, left: 0, top: 504 },
      ],
    };
    const next = screenFrameFromCornerDrag(
      prev,
      host,
      { x: 64, y: 48 },
      { x: 64 + 336, y: 48 + 252 },
    );
    expect(next.width).toBeCloseTo(336);
    expect(next.height).toBeCloseTo(252);
    expect(next.corners).toHaveLength(4);
  });
});

describe("scaleScreenFrameToWorldSize", () => {
  it("grows the screen frame when world crop grows", () => {
    const host = { left: 0, top: 0, width: 1000, height: 800 };
    const frame = {
      left: 100,
      top: 100,
      width: 400,
      height: 300,
      corners: [
        { corner: 3 as const, left: 0, top: 0 },
        { corner: 2 as const, left: 400, top: 0 },
        { corner: 1 as const, left: 400, top: 300 },
        { corner: 0 as const, left: 0, top: 300 },
      ],
    };
    const next = scaleScreenFrameToWorldSize(
      frame,
      host,
      { w: 10, d: 10 },
      { w: 20, d: 15 },
    );
    expect(next.width).toBeCloseTo(800);
    expect(next.height).toBeCloseTo(450);
  });
});

describe("resizeCropFromScreenRectCorner", () => {
  const base = { enabled: true, minX: 0, minY: 0, maxX: 10, maxY: 10 };

  it("keeps crop at drag start", () => {
    const out = resizeCropFromScreenRectCorner({
      baseline: base,
      corner: 2,
      startClient: { x: 200, y: 100 },
      curClient: { x: 200, y: 100 },
      oppClient: { x: 100, y: 200 },
    });
    expect(out.maxX).toBeCloseTo(10);
    expect(out.maxY).toBeCloseTo(10);
  });

  it("scales width and depth from both screen axes", () => {
    const out = resizeCropFromScreenRectCorner({
      baseline: base,
      corner: 2,
      startClient: { x: 200, y: 100 },
      curClient: { x: 250, y: 75 },
      oppClient: { x: 100, y: 200 },
    });
    expect(out.maxX).toBeCloseTo(15);
    expect(out.maxY).toBeCloseTo(12.5);
    expect(out.minX).toBeCloseTo(0);
    expect(out.minY).toBeCloseTo(0);
  });

  it("horizontal drag changes only width", () => {
    const out = resizeCropFromScreenRectCorner({
      baseline: base,
      corner: 2,
      startClient: { x: 200, y: 100 },
      curClient: { x: 300, y: 100 },
      oppClient: { x: 100, y: 200 },
    });
    expect(out.maxX).toBeCloseTo(20);
    expect(out.maxY).toBeCloseTo(10);
  });
});
