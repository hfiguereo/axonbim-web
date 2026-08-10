/**
 * F9-E1: commands are the guarantee, not the UI (ADR 0017).
 *
 * Every case here used to succeed or to be indistinguishable from "no changes".
 */
import { describe, expect, it } from "vitest";
import { createEmptyDocument, type Camera, type Door, type Wall } from "@axonbim/model";
import {
  CreateDoorCommand,
  CreateWallCommand,
  HistoryStack,
  SetCameraFovCommand,
  SetDoorHingeCommand,
  SetWallEndpointsCommand,
  SetWallFamilyCommand,
  SetWallHeightCommand,
  SetWallThicknessCommand,
  CreateCameraCommand,
  DeleteWallCommand,
} from "./index";

function wall(partial: Partial<Wall> = {}): Wall {
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

function door(partial: Partial<Door> = {}): Door {
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

function camera(partial: Partial<Camera> = {}): Camera {
  const eye = { x: 0, y: 0, z: 1.7 };
  const target = { x: 4, y: 0, z: 1.7 };
  return {
    id: "camera.1",
    name: "Cámara 1",
    eye,
    target,
    fov: 45,
    crop: { enabled: true, minX: -1, minY: -3, maxX: 5, maxY: 3 },
    ...partial,
  };
}

function docWithWall() {
  const doc = createEmptyDocument();
  doc.walls = [wall()];
  return doc;
}

describe("create commands reject invalid entities", () => {
  it("rejects a wall shorter than the minimum axis", () => {
    const doc = createEmptyDocument();
    const result = new CreateWallCommand(wall({ p2: { x: 0.01, y: 0, z: 0 } })).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("wall.length.min");
    expect(doc.walls).toHaveLength(0);
  });

  it("rejects a wall referencing a family the document does not have", () => {
    const doc = createEmptyDocument();
    const result = new CreateWallCommand(wall({ familyId: "family.nope" })).execute(doc);
    expect(result.ok).toBe(false);
    expect(doc.walls).toHaveLength(0);
  });

  it("rejects a door whose host wall does not exist", () => {
    const doc = createEmptyDocument();
    const result = new CreateDoorCommand(door({ wallId: "wall.missing" })).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("door.wall.unknown");
    expect(doc.doors).toHaveLength(0);
  });

  it("rejects a camera created with a fov out of range", () => {
    const doc = createEmptyDocument();
    const result = new CreateCameraCommand(camera({ fov: 200 })).execute(doc);
    expect(result.ok).toBe(false);
    expect(doc.cameras).toHaveLength(0);
  });
});

describe("setters validate the resulting entity", () => {
  it("rejects a height below the minimum instead of writing it", () => {
    const doc = docWithWall();
    const result = new SetWallHeightCommand("wall.1", 0.01).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("wall.height.min");
    expect(doc.walls[0]!.height).toBe(2.7);
  });

  it("SetWallEndpointsCommand updates axis and undoes", () => {
    const doc = docWithWall();
    const cmd = new SetWallEndpointsCommand(
      "wall.1",
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
    );
    expect(cmd.execute(doc).ok).toBe(true);
    expect(doc.walls[0]!.p2.x).toBe(5);
    cmd.undo(doc);
    expect(doc.walls[0]!.p2.x).toBe(3);
  });

  it("rejects a non-finite thickness", () => {
    const doc = docWithWall();
    const result = new SetWallThicknessCommand("wall.1", Number.NaN).execute(doc);
    expect(result.ok).toBe(false);
    expect(doc.walls[0]!.thickness).toBe(0.15);
  });

  it("rejects a family that is not in the document catalogue", () => {
    const doc = docWithWall();
    const result = new SetWallFamilyCommand("wall.1", "family.nope", 0.2).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("wall.family.unknown");
    expect(doc.walls[0]!.familyId).toBe("family.block-150");
  });

  it("rejects a fov the UI clamp used to hide (AX-P0-01)", () => {
    const doc = createEmptyDocument();
    new CreateCameraCommand(camera()).execute(doc);
    const result = new SetCameraFovCommand("camera.1", 200).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("camera.fov.range");
    expect(doc.cameras[0]!.fov).toBe(45);
  });

  it("rejects an enum value that arrived from outside TypeScript", () => {
    const doc = docWithWall();
    new CreateDoorCommand(door()).execute(doc);
    const cmd = new SetDoorHingeCommand("door.1", "middle" as Door["hinge"]);
    expect(cmd.execute(doc).ok).toBe(false);
    expect(doc.doors[0]!.hinge).toBe("start");
  });
});

describe("rejection, no-op and change are three different things", () => {
  it("reports a no-op when the value is already set", () => {
    const doc = docWithWall();
    expect(new SetWallHeightCommand("wall.1", 2.7).execute(doc)).toEqual({
      ok: true,
      changed: false,
      code: "noop",
    });
  });

  it("reports notFound rather than a silent no-op", () => {
    const doc = createEmptyDocument();
    const result = new SetWallHeightCommand("wall.missing", 3).execute(doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("wall.notFound");
  });

  it("does not record a rejected command in the history", () => {
    const doc = docWithWall();
    const hist = new HistoryStack();
    hist.push(new SetWallHeightCommand("wall.1", 0.01), doc);
    expect(hist.canUndo).toBe(false);
  });

  it("keeps the redo stack after a rejected command", () => {
    const doc = createEmptyDocument();
    const hist = new HistoryStack();
    hist.push(new CreateWallCommand(wall()), doc);
    hist.push(new DeleteWallCommand("wall.1"), doc);
    hist.undo(doc);
    expect(hist.canRedo).toBe(true);

    const result = hist.push(new SetWallHeightCommand("wall.1", 0.01), doc);
    expect(result.ok).toBe(false);
    expect(hist.canRedo).toBe(true);
  });
});
