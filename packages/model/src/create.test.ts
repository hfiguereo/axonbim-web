import { describe, expect, it } from "vitest";
import { createDemoDocument, createEmptyDocument } from "./create.js";
import type { AxonDocument } from "./types.js";

/**
 * The same referential rules the `.axon` parser enforces at the boundary
 * (A4 in the technical audit). A generated document must never be something the
 * app would refuse to reopen.
 */
function expectReferentialIntegrity(doc: AxonDocument) {
  const storeyIds = new Set(doc.storeys.map((s) => s.id));
  const familyIds = new Set(doc.families.map((f) => f.id));
  const wallIds = new Set(doc.walls.map((w) => w.id));

  expect(wallIds.size).toBe(doc.walls.length);
  for (const w of doc.walls) {
    expect(storeyIds.has(w.storeyId)).toBe(true);
    expect(familyIds.has(w.familyId)).toBe(true);
    expect(w.height).toBeGreaterThan(0);
    expect(w.thickness).toBeGreaterThan(0);
    expect(Math.hypot(w.p2.x - w.p1.x, w.p2.y - w.p1.y)).toBeGreaterThan(0);
  }
  for (const d of doc.doors) expect(wallIds.has(d.wallId)).toBe(true);
  for (const w of doc.windows) expect(wallIds.has(w.wallId)).toBe(true);
}

describe("createEmptyDocument", () => {
  it("starts with one storey, the builtin catalogs and nothing drawn", () => {
    const doc = createEmptyDocument();
    expect(doc.storeys).toHaveLength(1);
    expect(doc.walls).toEqual([]);
    expect(doc.doors).toEqual([]);
    expect(doc.windows).toEqual([]);
    expect(doc.cameras).toEqual([]);
    expect(doc.families.length).toBeGreaterThan(0);
    expect(doc.doorFamilies.length).toBeGreaterThan(0);
    expect(doc.windowFamilies.length).toBeGreaterThan(0);
  });

  it("stamps the .axon format metadata", () => {
    const doc = createEmptyDocument("Casa");
    expect(doc.meta.format).toBe("axon");
    expect(doc.meta.formatVersion).toBe(1);
    expect(doc.meta.name).toBe("Casa");
    expect(Number.isNaN(Date.parse(doc.meta.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(doc.meta.updatedAt))).toBe(false);
  });

  it("does not share the builtin catalog arrays between documents", () => {
    const a = createEmptyDocument();
    const b = createEmptyDocument();
    expect(a.families).not.toBe(b.families);
    a.families.pop();
    expect(b.families.length).toBeGreaterThan(a.families.length);
  });

  it("is referentially valid", () => {
    expectReferentialIntegrity(createEmptyDocument());
  });
});

describe("createDemoDocument", () => {
  it("draws the 8×6 m footprint plus one partition", () => {
    const doc = createDemoDocument();
    // The e2e smoke test asserts this count through the UI.
    expect(doc.walls).toHaveLength(5);

    const xs = doc.walls.flatMap((w) => [w.p1.x, w.p2.x]);
    const ys = doc.walls.flatMap((w) => [w.p1.y, w.p2.y]);
    expect(Math.min(...xs)).toBe(0);
    expect(Math.max(...xs)).toBe(8);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(6);
  });

  it("is referentially valid", () => {
    expectReferentialIntegrity(createDemoDocument());
  });

  it("returns an independent document on every call", () => {
    const a = createDemoDocument();
    const b = createDemoDocument();
    a.walls.pop();
    expect(a.walls).toHaveLength(4);
    expect(b.walls).toHaveLength(5);
  });
});
