import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./create.js";
import { deriveStoreyDatums } from "./storeyDatum.js";

describe("storeyDatum (LR3-B)", () => {
  it("marks the active storey without mutating the document", () => {
    const doc = createEmptyDocument();
    doc.storeys.push({ id: "storey.2", name: "Nivel 2", elevation: 3 });
    const before = structuredClone(doc.storeys);
    const datums = deriveStoreyDatums(doc, "storey.2");
    expect(datums).toHaveLength(2);
    expect(datums.find((d) => d.id === "storey.2")?.active).toBe(true);
    expect(datums.find((d) => d.id === "storey.default")?.active).toBe(false);
    expect(doc.storeys).toEqual(before);
  });
});
