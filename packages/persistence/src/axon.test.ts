import { describe, expect, it } from "vitest";
import { createEmptyDocument, defaultCameraCrop } from "@axonbim/model";
import { parseDocument, parseDocumentRecover, serializeDocument } from "./index";

describe("F5-S / F9-E5 .axon parser (strict)", () => {
  it("REG-07 accepts valid document", () => {
    const doc = createEmptyDocument("Test");
    doc.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 2, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    const round = parseDocument(serializeDocument(doc));
    expect(round.walls).toHaveLength(1);
    expect(round.meta.name).toBe("Test");
  });

  it("REG-06 rejects unknown wall family", () => {
    const doc = createEmptyDocument();
    doc.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.nope",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 2, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    expect(() => parseDocument(serializeDocument(doc))).toThrow(/unknown familyId/);
  });

  it("REG-06 rejects door with unknown wallId", () => {
    const raw = serializeDocument(createEmptyDocument());
    const data = JSON.parse(raw);
    data.doors = [
      {
        id: "door.1",
        wallId: "wall.missing",
        familyId: "family.door-90",
        centerOffset: 1,
        width: 0.9,
        height: 2.1,
        sill: 0,
        hinge: "start",
        swing: "positive",
        leafState: "open",
      },
    ];
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/unknown wallId/);
  });

  it("F9-E3 roundtrip keeps a custom wall family catalog", () => {
    const doc = createEmptyDocument("Custom cat");
    doc.families = [{ id: "family.custom-220", label: "Bloque custom 220", thickness: 0.22 }];
    doc.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.custom-220",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 3, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.22,
      },
    ];
    const again = parseDocument(serializeDocument(doc));
    expect(again.families).toEqual(doc.families);
    expect(again.walls[0]?.familyId).toBe("family.custom-220");
  });

  it("F9-E2 rejects overlapping door and window on the same wall", () => {
    const raw = serializeDocument(createEmptyDocument());
    const data = JSON.parse(raw);
    data.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 6, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    data.doors = [
      {
        id: "door.1",
        wallId: "wall.1",
        familyId: "family.door-90",
        centerOffset: 2.5,
        width: 0.9,
        height: 2.1,
        sill: 0,
        hinge: "start",
        swing: "positive",
        leafState: "open",
      },
    ];
    data.windows = [
      {
        id: "window.1",
        wallId: "wall.1",
        familyId: "family.window-90x120",
        centerOffset: 2.6,
        width: 0.9,
        height: 1.2,
        sill: 0.9,
        hinge: "start",
        swing: "positive",
        leafState: "closed",
      },
    ];
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/overlaps/);
  });

  it("REG-08 export → import stable wall count", () => {
    const doc = createEmptyDocument();
    doc.walls.push({
      id: "wall.1",
      storeyId: "storey.default",
      familyId: "family.block-150",
      p1: { x: 0, y: 0, z: 0 },
      p2: { x: 3, y: 0, z: 0 },
      height: 2.7,
      thickness: 0.15,
    });
    const again = parseDocument(serializeDocument(parseDocument(serializeDocument(doc))));
    expect(again.walls).toHaveLength(1);
    expect(again.walls[0]?.id).toBe("wall.1");
  });

  it("F9-E5 rejects walls as object (shape)", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.walls = { not: "array" };
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/walls must be an array/);
  });

  it("F9-E5 rejects door without leafState (no silent default)", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 4, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    data.doors = [
      {
        id: "door.1",
        wallId: "wall.1",
        familyId: "family.door-90",
        centerOffset: 1,
        width: 0.9,
        height: 2.1,
        sill: 0,
        hinge: "start",
        swing: "positive",
      },
    ];
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/leafState/);
  });

  it("F9-E5 rejects camera with inverted crop (no silent normalize)", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.cameras = [
      {
        id: "camera.1",
        name: "Cam",
        eye: { x: 0, y: 0, z: 1.7 },
        target: { x: 2, y: 0, z: 1.7 },
        fov: 45,
        crop: { enabled: true, minX: 5, minY: 0, maxX: 1, maxY: 2 },
      },
    ];
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/crop|max must be greater/i);
  });

  it("F9-E5 rejects missing doorFamilies key", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    delete data.doorFamilies;
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/missing doorFamilies/);
  });

  it("F9-E5 rejects duplicate ids across kinds", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.walls = [
      {
        id: "storey.default",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 2, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/duplicate id/);
  });
});

describe("F9-E5 .axon recovery parser", () => {
  it("recovers overlapping openings by keeping the door", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 6, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    data.doors = [
      {
        id: "door.1",
        wallId: "wall.1",
        familyId: "family.door-90",
        centerOffset: 2.5,
        width: 0.9,
        height: 2.1,
        sill: 0,
        hinge: "start",
        swing: "positive",
        leafState: "open",
      },
    ];
    data.windows = [
      {
        id: "window.1",
        wallId: "wall.1",
        familyId: "family.window-90x120",
        centerOffset: 2.6,
        width: 0.9,
        height: 1.2,
        sill: 0.9,
        hinge: "start",
        swing: "positive",
        leafState: "closed",
      },
    ];
    const { document, warnings } = parseDocumentRecover(JSON.stringify(data));
    expect(document.doors).toHaveLength(1);
    expect(document.windows).toHaveLength(0);
    expect(warnings.some((w) => /window\.1/.test(w))).toBe(true);
    // Recovered doc must reopen strictly.
    expect(() => parseDocument(serializeDocument(document))).not.toThrow();
  });

  it("repairs inverted crop with a warning", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.cameras = [
      {
        id: "camera.1",
        name: "Cam",
        eye: { x: 0, y: 0, z: 1.7 },
        target: { x: 2, y: 0, z: 1.7 },
        fov: 45,
        crop: { enabled: true, minX: 5, minY: 0, maxX: 1, maxY: 2 },
      },
    ];
    const { document, warnings } = parseDocumentRecover(JSON.stringify(data));
    expect(document.cameras).toHaveLength(1);
    expect(document.cameras[0]!.crop.maxX).toBeGreaterThan(document.cameras[0]!.crop.minX);
    expect(warnings.some((w) => /crop/i.test(w))).toBe(true);
  });

  it("defaults missing door leafState and seeds missing doorFamilies", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    delete data.doorFamilies;
    data.walls = [
      {
        id: "wall.1",
        storeyId: "storey.default",
        familyId: "family.block-150",
        p1: { x: 0, y: 0, z: 0 },
        p2: { x: 4, y: 0, z: 0 },
        height: 2.7,
        thickness: 0.15,
      },
    ];
    data.doors = [
      {
        id: "door.1",
        wallId: "wall.1",
        familyId: "family.door-90",
        centerOffset: 1,
        width: 0.9,
        height: 2.1,
      },
    ];
    const { document, warnings } = parseDocumentRecover(JSON.stringify(data));
    expect(document.doors).toHaveLength(1);
    expect(document.doors[0]?.leafState).toBe("open");
    expect(document.doorFamilies.length).toBeGreaterThan(0);
    expect(warnings.some((w) => /doorFamilies|leafState|sill|hinge|swing/i.test(w))).toBe(true);
  });

  it("still fails on corrupt JSON", () => {
    expect(() => parseDocumentRecover("{not json")).toThrow(/JSON parse error/);
  });

  it("synthesizes camera crop when missing", () => {
    const eye = { x: 0, y: 0, z: 1.7 };
    const target = { x: 1, y: 0, z: 1.7 };
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.cameras = [{ id: "camera.1", name: "Cam", eye, target, fov: 45 }];
    const { document, warnings } = parseDocumentRecover(JSON.stringify(data));
    expect(document.cameras[0]?.crop).toEqual(defaultCameraCrop(eye, target, 45));
    expect(warnings.some((w) => /crop/i.test(w))).toBe(true);
  });
});

describe("presentation.viewCrops persistence", () => {
  it("roundtrips enabled plan crop", () => {
    const doc = createEmptyDocument("Cropped");
    doc.presentation = {
      viewCrops: {
        "view.plan.level1": {
          enabled: true,
          minX: -1,
          minY: -1,
          maxX: 9,
          maxY: 7,
        },
      },
    };
    const again = parseDocument(serializeDocument(doc));
    expect(again.presentation?.viewCrops["view.plan.level1"]).toEqual({
      enabled: true,
      minX: -1,
      minY: -1,
      maxX: 9,
      maxY: 7,
    });
  });

  it("omits disabled crops on serialize", () => {
    const doc = createEmptyDocument();
    doc.presentation = {
      viewCrops: {
        "view.plan.level1": {
          enabled: false,
          minX: 0,
          minY: 0,
          maxX: 1,
          maxY: 1,
        },
      },
    };
    const raw = JSON.parse(serializeDocument(doc));
    expect(raw.presentation).toBeUndefined();
  });

  it("strict rejects disabled crop in presentation", () => {
    const data = JSON.parse(serializeDocument(createEmptyDocument()));
    data.presentation = {
      viewCrops: {
        "view.plan.level1": {
          enabled: false,
          minX: 0,
          minY: 0,
          maxX: 2,
          maxY: 2,
        },
      },
    };
    expect(() => parseDocument(JSON.stringify(data))).toThrow(/only enabled crops/);
  });
});

