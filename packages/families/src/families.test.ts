import { describe, expect, it } from "vitest";
import {
  BUILTIN_DOOR_FAMILIES,
  BUILTIN_WALL_FAMILIES,
  BUILTIN_WINDOW_FAMILIES,
  doorFamilyById,
  familyById,
  windowFamilyById,
} from "./index.js";

describe("builtin catalogs", () => {
  it("have unique ids", () => {
    for (const list of [
      BUILTIN_WALL_FAMILIES,
      BUILTIN_DOOR_FAMILIES,
      BUILTIN_WINDOW_FAMILIES,
    ]) {
      expect(list.length).toBeGreaterThan(0);
      expect(new Set(list.map((f) => f.id)).size).toBe(list.length);
    }
  });

  it("have positive dimensions and a label", () => {
    for (const f of BUILTIN_WALL_FAMILIES) {
      expect(f.thickness).toBeGreaterThan(0);
      expect(f.label.trim()).not.toBe("");
    }
    for (const f of BUILTIN_DOOR_FAMILIES) {
      expect(f.width).toBeGreaterThan(0);
      expect(f.height).toBeGreaterThan(0);
      expect(f.label.trim()).not.toBe("");
    }
    for (const f of BUILTIN_WINDOW_FAMILIES) {
      expect(f.width).toBeGreaterThan(0);
      expect(f.height).toBeGreaterThan(0);
      expect(f.sill).toBeGreaterThanOrEqual(0);
      expect(f.label.trim()).not.toBe("");
    }
  });

  /**
   * The session store hardcodes these ids as the startup defaults, so renaming a
   * family without updating them would leave a new project pointing at nothing.
   */
  it("keep the ids the app uses as defaults", () => {
    expect(familyById("family.block-150")).toBeDefined();
    expect(doorFamilyById("family.door-90")).toBeDefined();
    expect(windowFamilyById("family.window-90x120")).toBeDefined();
  });
});

describe("lookups", () => {
  it("find a builtin by id", () => {
    expect(familyById("family.block-150")?.thickness).toBe(0.15);
    expect(doorFamilyById("family.door-80")?.width).toBe(0.8);
    expect(windowFamilyById("family.window-60x100")?.sill).toBe(0.9);
  });

  it("return undefined for an unknown id rather than throwing", () => {
    expect(familyById("family.nope")).toBeUndefined();
    expect(doorFamilyById("family.nope")).toBeUndefined();
    expect(windowFamilyById("family.nope")).toBeUndefined();
    expect(familyById("")).toBeUndefined();
  });

  it("does not confuse catalogs with each other", () => {
    expect(familyById("family.door-90")).toBeUndefined();
    expect(doorFamilyById("family.block-150")).toBeUndefined();
    expect(windowFamilyById("family.door-90")).toBeUndefined();
  });
});
