import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "./create.js";
import { defaultCameraCrop } from "./viewCrop.js";
import type { Camera, Door, Wall, Window } from "./types.js";
import {
  documentRefs,
  validateCamera,
  validateDoor,
  validateViewCrop,
  validateWall,
  validateWindow,
  type DocumentRefs,
} from "./validate.js";

function docWithWall(): { refs: DocumentRefs } {
  const doc = createEmptyDocument();
  doc.walls = [validWall()];
  return { refs: documentRefs(doc) };
}

function validWall(partial: Partial<Wall> = {}): Wall {
  return {
    id: "wall.1",
    storeyId: "storey.default",
    familyId: "family.block-150",
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: 3, y: 0, z: 0 },
    height: 2.7,
    thickness: 0.15,
    ...partial,
  };
}

function validDoor(partial: Partial<Door> = {}): Door {
  return {
    id: "door.1",
    wallId: "wall.1",
    familyId: "family.door-90",
    centerOffset: 1.5,
    width: 0.9,
    height: 2.1,
    sill: 0,
    hinge: "start",
    swing: "positive",
    leafState: "open",
    ...partial,
  };
}

function validWindow(partial: Partial<Window> = {}): Window {
  return {
    id: "window.1",
    wallId: "wall.1",
    familyId: "family.window-90x120",
    centerOffset: 1.5,
    width: 0.9,
    height: 1.2,
    sill: 0.9,
    hinge: "start",
    swing: "positive",
    leafState: "closed",
    ...partial,
  };
}

function validCamera(partial: Partial<Camera> = {}): Camera {
  const eye = { x: 0, y: 0, z: 1.7 };
  const target = { x: 4, y: 0, z: 1.7 };
  return {
    id: "camera.1",
    name: "Cámara 1",
    eye,
    target,
    fov: 45,
    crop: defaultCameraCrop(eye, target, 45),
    ...partial,
  };
}

describe("validateWall", () => {
  const refs = documentRefs(createEmptyDocument());

  it("accepts a well-formed wall", () => {
    expect(validateWall(validWall(), refs)).toBeNull();
  });

  it("rejects an unknown storey", () => {
    expect(validateWall(validWall({ storeyId: "storey.nope" }), refs)?.code).toBe(
      "wall.storey.unknown",
    );
  });

  it("rejects an unknown family", () => {
    expect(validateWall(validWall({ familyId: "family.nope" }), refs)?.code).toBe(
      "wall.family.unknown",
    );
  });

  it("rejects height below the documented minimum", () => {
    expect(validateWall(validWall({ height: 0.049 }), refs)?.code).toBe("wall.height.min");
    expect(validateWall(validWall({ height: 0 }), refs)?.code).toBe("wall.height.min");
    expect(validateWall(validWall({ height: -2 }), refs)?.code).toBe("wall.height.min");
  });

  it("rejects non-finite numbers", () => {
    expect(validateWall(validWall({ height: Number.NaN }), refs)?.code).toBe("wall.height.min");
    expect(validateWall(validWall({ thickness: Number.POSITIVE_INFINITY }), refs)?.code).toBe(
      "wall.thickness.min",
    );
  });

  it("rejects thickness below the documented minimum", () => {
    expect(validateWall(validWall({ thickness: 0.01 }), refs)?.code).toBe("wall.thickness.min");
  });

  it("rejects a degenerate axis", () => {
    const degenerate = validWall({ p2: { x: 0, y: 0.01, z: 0 } });
    expect(validateWall(degenerate, refs)?.code).toBe("wall.length.min");
  });

  it("rejects malformed points", () => {
    const broken = validWall({ p1: { x: Number.NaN, y: 0, z: 0 } });
    expect(validateWall(broken, refs)?.code).toBe("wall.point.invalid");
  });
});

describe("validateDoor / validateWindow", () => {
  const { refs } = docWithWall();

  it("accepts well-formed openings", () => {
    expect(validateDoor(validDoor(), refs)).toBeNull();
    expect(validateWindow(validWindow(), refs)).toBeNull();
  });

  it("rejects an unknown host wall", () => {
    expect(validateDoor(validDoor({ wallId: "wall.nope" }), refs)?.code).toBe(
      "door.wall.unknown",
    );
    expect(validateWindow(validWindow({ wallId: "wall.nope" }), refs)?.code).toBe(
      "window.wall.unknown",
    );
  });

  it("rejects an unknown family", () => {
    expect(validateDoor(validDoor({ familyId: "family.nope" }), refs)?.code).toBe(
      "door.family.unknown",
    );
  });

  it("rejects non-positive or non-finite sizes", () => {
    expect(validateDoor(validDoor({ width: 0 }), refs)?.code).toBe("door.width.invalid");
    expect(validateDoor(validDoor({ height: Number.NaN }), refs)?.code).toBe(
      "door.height.invalid",
    );
  });

  it("rejects a negative offset or sill", () => {
    expect(validateDoor(validDoor({ centerOffset: -0.1 }), refs)?.code).toBe(
      "door.offset.invalid",
    );
    expect(validateWindow(validWindow({ sill: -0.1 }), refs)?.code).toBe("window.sill.invalid");
  });

  it("rejects enum values that types alone cannot enforce at runtime", () => {
    const badHinge = { ...validDoor(), hinge: "middle" } as unknown as Door;
    expect(validateDoor(badHinge, refs)?.code).toBe("door.hinge.invalid");
    const badLeaf = { ...validWindow(), leafState: "wide" } as unknown as Window;
    expect(validateWindow(badLeaf, refs)?.code).toBe("window.leafState.invalid");
  });

  it("entity validation does not check fit — that is openingFit / F9-E2", () => {
    // centerOffset past the wall is allowed here; validateHostedOpening rejects it.
    const hangingOff = validDoor({ centerOffset: 99 });
    expect(validateDoor(hangingOff, refs)).toBeNull();
  });
});

describe("validateCamera", () => {
  it("accepts a well-formed camera", () => {
    expect(validateCamera(validCamera())).toBeNull();
  });

  it("rejects a fov outside 10–120", () => {
    expect(validateCamera(validCamera({ fov: 9 }))?.code).toBe("camera.fov.range");
    expect(validateCamera(validCamera({ fov: 121 }))?.code).toBe("camera.fov.range");
    expect(validateCamera(validCamera({ fov: Number.NaN }))?.code).toBe("camera.fov.range");
  });

  it("rejects eye and target at the same place", () => {
    const c = validCamera({ target: { x: 0, y: 0, z: 1.7 } });
    expect(validateCamera(c)?.code).toBe("camera.eyeTarget.tooClose");
  });

  it("requires a name", () => {
    expect(validateCamera(validCamera({ name: "" }))?.code).toBe("camera.name.required");
  });
});

describe("validateViewCrop", () => {
  it("accepts a normalized crop", () => {
    const crop = { enabled: true, minX: 0, minY: 0, maxX: 4, maxY: 3 };
    expect(validateViewCrop(crop, "crop")).toBeNull();
  });

  it("rejects inverted bounds", () => {
    const crop = { enabled: true, minX: 4, minY: 0, maxX: 0, maxY: 3 };
    expect(validateViewCrop(crop, "crop")?.code).toBe("crop.bounds.inverted");
  });

  it("rejects non-finite bounds", () => {
    const crop = { enabled: true, minX: 0, minY: 0, maxX: Number.NaN, maxY: 3 };
    expect(validateViewCrop(crop, "crop")?.code).toBe("crop.bounds.invalid");
  });
});
