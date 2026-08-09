import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./create.js";
import {
  getActiveStorey,
  getActiveStoreyElevation,
  reconcileActiveStoreyId,
} from "./activeStorey.js";

describe("activeStorey (LR3-A)", () => {
  it("reconciles preferred id when present", () => {
    const doc = createEmptyDocument();
    expect(reconcileActiveStoreyId(doc, "storey.default")).toBe("storey.default");
  });

  it("falls back when preferred id is missing", () => {
    const doc = createEmptyDocument();
    expect(reconcileActiveStoreyId(doc, "storey.gone")).toBe("storey.default");
  });

  it("getActiveStorey returns elevation for wall creation", () => {
    const doc = createEmptyDocument();
    doc.storeys[0]!.elevation = 3.2;
    const s = getActiveStorey(doc, "storey.default");
    expect(s.elevation).toBe(3.2);
    expect(getActiveStoreyElevation(doc, null)).toBe(3.2);
  });

  it("never keeps an unknown id active", () => {
    const doc = createEmptyDocument();
    doc.storeys.push({ id: "storey.2", name: "Nivel 2", elevation: 3 });
    expect(reconcileActiveStoreyId(doc, "nope")).toBe("storey.default");
    expect(getActiveStorey(doc, "nope").id).toBe("storey.default");
  });
});
