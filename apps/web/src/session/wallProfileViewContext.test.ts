import { describe, expect, it } from "vitest";
import { wallProfileEditContext } from "./wallProfileViewContext";

describe("wallProfileEditContext (SK-wall-profile-v1 Bloque 5)", () => {
  it("rejects plan", () => {
    const c = wallProfileEditContext("plan");
    expect(c.allowed).toBe(false);
    expect(c.reason).toMatch(/planta/i);
  });

  it("rejects documentary camera", () => {
    const c = wallProfileEditContext("camera");
    expect(c.allowed).toBe(false);
    expect(c.reason).toMatch(/cámara|Perspectiva/i);
  });

  it("allows perspective (elevation presets / 3D)", () => {
    expect(wallProfileEditContext("perspective").allowed).toBe(true);
  });
});
