import { describe, expect, it } from "vitest";
import {
  findDoorFamily,
  findWallFamily,
  pickCatalogId,
  reconcileActiveFamilyIds,
} from "./catalog.js";
import { createEmptyDocument } from "./create.js";
import type { AxonDocument } from "./types.js";

describe("catalog (F9-E3 policy A)", () => {
  it("finds families inside a document catalog, not only built-ins", () => {
    const custom = [{ id: "family.custom-wall", label: "Custom", thickness: 0.22 }];
    expect(findWallFamily(custom, "family.custom-wall")?.thickness).toBe(0.22);
    expect(findWallFamily(custom, "family.block-150")).toBeUndefined();
    expect(findDoorFamily([{ id: "family.door-x", label: "X", width: 1, height: 2 }], "family.door-x")).toBeDefined();
  });

  it("pickCatalogId keeps a preferred id that exists", () => {
    const cat = [{ id: "a" }, { id: "b" }];
    expect(pickCatalogId(cat, "b")).toBe("b");
  });

  it("pickCatalogId falls back to the first catalog entry", () => {
    const cat = [{ id: "a" }, { id: "b" }];
    expect(pickCatalogId(cat, "missing")).toBe("a");
  });

  it("reconcileActiveFamilyIds replaces missing preferred ids deterministically", () => {
    const doc: AxonDocument = createEmptyDocument();
    doc.families = [{ id: "family.only-wall", label: "Only", thickness: 0.18 }];
    doc.doorFamilies = [{ id: "family.only-door", label: "Only door", width: 1, height: 2.1 }];
    doc.windowFamilies = [
      { id: "family.only-win", label: "Only win", width: 1, height: 1, sill: 0.9 },
    ];
    const next = reconcileActiveFamilyIds(doc, {
      activeFamilyId: "family.block-150",
      activeDoorFamilyId: "family.door-90",
      activeWindowFamilyId: "family.window-90x120",
    });
    expect(next).toEqual({
      activeFamilyId: "family.only-wall",
      activeDoorFamilyId: "family.only-door",
      activeWindowFamilyId: "family.only-win",
    });
  });

  it("reconcile keeps preferred when still present after load", () => {
    const doc = createEmptyDocument();
    const next = reconcileActiveFamilyIds(doc, {
      activeFamilyId: "family.block-200",
      activeDoorFamilyId: "family.door-80",
      activeWindowFamilyId: "family.window-60x100",
    });
    expect(next.activeFamilyId).toBe("family.block-200");
    expect(next.activeDoorFamilyId).toBe("family.door-80");
    expect(next.activeWindowFamilyId).toBe("family.window-60x100");
  });
});
