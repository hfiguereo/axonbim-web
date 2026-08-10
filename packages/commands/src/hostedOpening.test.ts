/**
 * F9-E2: door↔window overlap is symmetric; family change re-validates.
 */
import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Door, type Wall, type Window } from "@axonbim/model";
import {
  CreateDoorCommand,
  CreateWindowCommand,
  SetDoorFamilyCommand,
  SetWindowFamilyCommand,
} from "./index";

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

function door(partial: Partial<Door> = {}): Door {
  return {
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
    ...partial,
  };
}

function window(partial: Partial<Window> = {}): Window {
  return {
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
    ...partial,
  };
}

describe("hosted opening commands (F9-E2)", () => {
  it("rejects placing a door on top of an existing window", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall()];
    expect(new CreateWindowCommand(window({ centerOffset: 2.5 })).execute(doc)).toEqual({
      ok: true,
      changed: true,
    });
    const result = new CreateDoorCommand(door({ centerOffset: 2.6 })).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("opening.overlap");
    expect(doc.doors).toHaveLength(0);
  });

  it("rejects placing a window on top of an existing door (same rule, opposite order)", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall()];
    expect(new CreateDoorCommand(door({ centerOffset: 2.5 })).execute(doc).ok).toBe(true);
    const result = new CreateWindowCommand(window({ centerOffset: 2.6 })).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("opening.overlap");
    expect(doc.windows).toHaveLength(0);
  });

  it("accepts door then window when clear of each other", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall()];
    expect(new CreateDoorCommand(door({ centerOffset: 1.5 })).execute(doc).ok).toBe(true);
    expect(new CreateWindowCommand(window({ centerOffset: 4.5 })).execute(doc).ok).toBe(true);
    expect(doc.doors).toHaveLength(1);
    expect(doc.windows).toHaveLength(1);
  });

  it("rejects a family change that would invade a window (AX-P1-04)", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall()];
    // Centers 0.95 m apart: clear at width 0.8, overlaps at width 1.0.
    doc.doors = [door({ id: "door.1", centerOffset: 2.0, width: 0.8, familyId: "family.door-80" })];
    doc.windows = [window({ centerOffset: 2.95, width: 0.9 })];
    const result = new SetDoorFamilyCommand("door.1", "family.door-100", 1.0, 2.1).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("opening.overlap");
    expect(doc.doors[0]!.width).toBe(0.8);
  });

  it("rejects a window family that does not fit vertically", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall({ vertical: { kind: "uniform", height: 2.0 } })];
    doc.windows = [window({ sill: 0.9, height: 1.0 })];
    // 0.9 + 1.2 = 2.1 > 2.0 - 0.05
    const result = new SetWindowFamilyCommand(
      "window.1",
      "family.window-90x120",
      0.9,
      1.2,
      0.9,
    ).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("opening.verticalFit");
  });

  it("rejects an opening too close to the wall end", () => {
    const doc = createEmptyDocument();
    doc.walls = [wall()];
    const result = new CreateDoorCommand(door({ centerOffset: 0.2, width: 0.9 })).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("opening.endMargin");
  });
});
