import { describe, expect, it } from "vitest";
import { createEmptyDocument } from "@axonbim/model";
import { parseDocument, serializeDocument } from "./index";

describe("F5-S .axon parser", () => {
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
});
