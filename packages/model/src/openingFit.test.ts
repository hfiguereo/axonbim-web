import { describe, expect, it } from "vitest";
import {
  OPENING_END_MARGIN,
  asOpeningSpec,
  openingsOnWall,
  openingsOverlap,
  validateHostedOpening,
  validateOpeningFitsWall,
  type HostedOpeningSpec,
} from "./openingFit.js";
import type { Door, Wall, Window } from "./types.js";

function wall(partial: Partial<Wall> = {}): Wall {
  return {
    id: "wall.1",
    storeyId: "storey.default",
    familyId: "family.block-150",
    p1: { x: 0, y: 0, z: 0 },
    p2: { x: 6, y: 0, z: 0 },
    thickness: 0.15,
    vertical: { kind: "uniform", height: 2.7 },
    ...partial,
  };
}

function opening(partial: Partial<HostedOpeningSpec> & Pick<HostedOpeningSpec, "id">): HostedOpeningSpec {
  return {
    wallId: "wall.1",
    centerOffset: 3,
    width: 0.9,
    height: 2.1,
    sill: 0,
    ...partial,
  };
}

describe("validateOpeningFitsWall", () => {
  it("accepts an opening clear of the ends and under the wall height", () => {
    expect(validateOpeningFitsWall(opening({ id: "a" }), wall())).toBeNull();
  });

  it("rejects an opening too close to either end", () => {
    const half = 0.45;
    const tooCloseStart = opening({ id: "a", centerOffset: half + OPENING_END_MARGIN - 0.01 });
    expect(validateOpeningFitsWall(tooCloseStart, wall())?.code).toBe("opening.endMargin");
    const tooCloseEnd = opening({ id: "a", centerOffset: 6 - half - OPENING_END_MARGIN + 0.01 });
    expect(validateOpeningFitsWall(tooCloseEnd, wall())?.code).toBe("opening.endMargin");
  });

  it("rejects sill+height that exceeds the wall", () => {
    const tall = opening({ id: "a", sill: 0.9, height: 2.0 });
    expect(validateOpeningFitsWall(tall, wall())?.code).toBe("opening.verticalFit");
  });
});

describe("openingsOverlap / validateHostedOpening", () => {
  it("detects overlapping intervals including the gap", () => {
    expect(
      openingsOverlap(
        { centerOffset: 2, width: 0.9 },
        { centerOffset: 2.5, width: 0.9 },
      ),
    ).toBe(true);
    expect(
      openingsOverlap(
        { centerOffset: 1.5, width: 0.9 },
        { centerOffset: 4.5, width: 0.9 },
      ),
    ).toBe(false);
  });

  it("rejects door↔window overlap in both orders (AX-P1-04)", () => {
    const host = wall();
    const door = opening({ id: "door.1", centerOffset: 2.5, width: 0.9 });
    const window = opening({
      id: "window.1",
      centerOffset: 2.7,
      width: 0.9,
      height: 1.2,
      sill: 0.9,
    });
    expect(validateHostedOpening(door, host, [window])?.code).toBe("opening.overlap");
    expect(validateHostedOpening(window, host, [door])?.code).toBe("opening.overlap");
  });

  it("accepts two clear openings on the same wall", () => {
    const host = wall();
    const a = opening({ id: "door.1", centerOffset: 1.5 });
    const b = opening({
      id: "window.1",
      centerOffset: 4.5,
      height: 1.2,
      sill: 0.9,
    });
    expect(validateHostedOpening(a, host, [b])).toBeNull();
    expect(validateHostedOpening(b, host, [a])).toBeNull();
  });

  it("openingsOnWall merges doors and windows and can exclude self", () => {
    const doors: Door[] = [
      {
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
      },
    ];
    const windows: Window[] = [
      {
        id: "window.1",
        wallId: "wall.1",
        familyId: "family.window-90x120",
        centerOffset: 4.5,
        width: 0.9,
        height: 1.2,
        sill: 0.9,
        hinge: "start",
        swing: "positive",
        leafState: "closed",
      },
    ];
    expect(openingsOnWall("wall.1", doors, windows).map((o) => o.id)).toEqual([
      "door.1",
      "window.1",
    ]);
    expect(openingsOnWall("wall.1", doors, windows, "door.1").map((o) => o.id)).toEqual([
      "window.1",
    ]);
    expect(asOpeningSpec(doors[0]!).id).toBe("door.1");
  });
});
