import { describe, expect, it } from "vitest";
import {
  isSketchDrawMode,
  isSketchDrawModeReady,
  paradigmForDrawMode,
} from "./editingParadigm.js";

describe("editingParadigm (SK-v1)", () => {
  it("maps line to parametric and rectangle to sketch", () => {
    expect(paradigmForDrawMode("line")).toBe("parametric");
    expect(paradigmForDrawMode("rectangle")).toBe("sketch");
    expect(isSketchDrawMode("rectangle")).toBe(true);
    expect(isSketchDrawModeReady("rectangle")).toBe(true);
    expect(isSketchDrawModeReady("arcSER")).toBe(true);
    expect(isSketchDrawModeReady("pickFace")).toBe(true);
  });
});
