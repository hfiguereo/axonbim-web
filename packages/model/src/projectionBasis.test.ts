import { describe, expect, it } from "vitest";
import {
  allProjectionBases,
  getProjectionBasis,
  projectWorldToDrawing,
} from "./projectionBasis.js";

describe("projectionBasis (LR3-D)", () => {
  it("exposes five canonical bases", () => {
    expect(allProjectionBases()).toHaveLength(5);
  });

  it("top: East→u, North→v", () => {
    const b = getProjectionBasis("top");
    const east = projectWorldToDrawing(b, { x: 2, y: 0, z: 0 });
    const north = projectWorldToDrawing(b, { x: 0, y: 3, z: 0 });
    expect(east.u).toBeCloseTo(2);
    expect(east.v).toBeCloseTo(0);
    expect(north.u).toBeCloseTo(0);
    expect(north.v).toBeCloseTo(3);
  });

  it("north elevation: East→u, Up→v", () => {
    const b = getProjectionBasis("north");
    const p = projectWorldToDrawing(b, { x: 2, y: 9, z: 1.5 });
    expect(p.u).toBeCloseTo(2);
    expect(p.v).toBeCloseTo(1.5);
  });

  it("maps to existing camera presets", () => {
    expect(getProjectionBasis("top").cameraPreset).toBe("top");
    expect(getProjectionBasis("south").cameraPreset).toBe("front");
    expect(getProjectionBasis("north").cameraPreset).toBe("back");
    expect(getProjectionBasis("east").cameraPreset).toBe("right");
    expect(getProjectionBasis("west").cameraPreset).toBe("left");
  });
});
