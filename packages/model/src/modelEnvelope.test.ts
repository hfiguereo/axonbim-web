import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Wall } from "./index.js";
import { computeModelEnvelope } from "./modelEnvelope.js";

function wall(partial: Partial<Wall> & Pick<Wall, "id" | "p1" | "p2">): Wall {
  return {
    storeyId: "storey.default",
    familyId: "family.block-150",
    thickness: 0.15,
    vertical: { kind: "uniform", height: 2.7 },
    ...partial,
  };
}

describe("modelEnvelope (LR3-C)", () => {
  it("empty document → empty envelope", () => {
    const env = computeModelEnvelope(createEmptyDocument());
    expect(env.empty).toBe(true);
    expect(env.size).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("grows from walls including negatives and height", () => {
    const doc = createEmptyDocument();
    doc.walls.push(
      wall({
        id: "w1",
        p1: { x: -2, y: -1, z: 0 },
        p2: { x: 4, y: 3, z: 0 },
        vertical: { kind: "uniform", height: 2.7 },
      }),
    );
    const env = computeModelEnvelope(doc);
    expect(env.empty).toBe(false);
    expect(env.minX).toBe(-2);
    expect(env.maxX).toBe(4);
    expect(env.minY).toBe(-1);
    expect(env.maxY).toBe(3);
    expect(env.minZ).toBe(0);
    expect(env.maxZ).toBe(2.7);
    expect(env.center.x).toBeCloseTo(1);
    expect(env.center.y).toBeCloseTo(1);
  });

  it("does not mutate the document", () => {
    const doc = createEmptyDocument();
    doc.walls.push(
      wall({ id: "w1", p1: { x: 0, y: 0, z: 0 }, p2: { x: 1, y: 0, z: 0 } }),
    );
    const n = doc.walls.length;
    computeModelEnvelope(doc);
    expect(doc.walls).toHaveLength(n);
  });
});
