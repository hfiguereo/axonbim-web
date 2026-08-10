import type { AxonDocument, Wall } from "@axonbim/model";
import {
  asOpeningSpec,
  documentRefs,
  openingsOnWall,
  validateHostedOpening,
  validateWall,
} from "@axonbim/model";
import { CHANGED, NOOP, rejected, type Command, type CommandResult } from "./types";

export type { Command } from "./types";
export { HistoryStack } from "./history";

let wallSeq = 0;

export function resetWallIdSeq(n = 0): void {
  wallSeq = n;
}

export function createWallId(): string {
  wallSeq += 1;
  return `wall.${wallSeq}`;
}

function notFound(wallId: string): CommandResult {
  return rejected({ code: "wall.notFound", message: `wall ${wallId}: not found` });
}

/** Validates the wall as it would look after the change. */
function checkWall(doc: AxonDocument, candidate: Wall): CommandResult | null {
  const issue = validateWall(candidate, documentRefs(doc));
  return issue ? rejected(issue) : null;
}

export class CreateWallCommand implements Command {
  readonly id: string;
  readonly type = "wall.create";
  constructor(private readonly wall: Wall) {
    this.id = `cmd.create.${wall.id}`;
  }

  execute(doc: AxonDocument): CommandResult {
    if (doc.walls.some((w) => w.id === this.wall.id)) {
      return rejected({
        code: "wall.duplicateId",
        message: `wall ${this.wall.id}: id already exists`,
      });
    }
    const invalid = checkWall(doc, this.wall);
    if (invalid) return invalid;
    doc.walls.push({ ...this.wall, p1: { ...this.wall.p1 }, p2: { ...this.wall.p2 } });
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    doc.walls = doc.walls.filter((w) => w.id !== this.wall.id);
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class DeleteWallCommand implements Command {
  readonly id: string;
  readonly type = "wall.delete";
  private snapshot: Wall | null = null;
  private doorSnapshots: AxonDocument["doors"] = [];
  private windowSnapshots: AxonDocument["windows"] = [];

  constructor(private readonly wallId: string) {
    this.id = `cmd.delete.${wallId}`;
  }

  execute(doc: AxonDocument): CommandResult {
    const found = doc.walls.find((w) => w.id === this.wallId);
    if (!found) return notFound(this.wallId);
    this.snapshot = {
      ...found,
      p1: { ...found.p1 },
      p2: { ...found.p2 },
    };
    this.doorSnapshots = doc.doors.filter((d) => d.wallId === this.wallId).map((d) => ({ ...d }));
    this.windowSnapshots = doc.windows
      .filter((w) => w.wallId === this.wallId)
      .map((w) => ({ ...w }));
    doc.walls = doc.walls.filter((w) => w.id !== this.wallId);
    doc.doors = doc.doors.filter((d) => d.wallId !== this.wallId);
    doc.windows = doc.windows.filter((w) => w.wallId !== this.wallId);
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    if (!this.snapshot) return;
    doc.walls.push({
      ...this.snapshot,
      p1: { ...this.snapshot.p1 },
      p2: { ...this.snapshot.p2 },
    });
    for (const d of this.doorSnapshots) doc.doors.push({ ...d });
    for (const w of this.windowSnapshots) doc.windows.push({ ...w });
    doc.meta.updatedAt = new Date().toISOString();
  }
}

/** SK-profile — update wall axis in place (preserves id / openings when they still fit). */
export class SetWallEndpointsCommand implements Command {
  readonly id: string;
  readonly type = "wall.setEndpoints";
  private prev: { p1: Wall["p1"]; p2: Wall["p2"] } | null = null;

  constructor(
    private readonly wallId: string,
    private readonly p1: Wall["p1"],
    private readonly p2: Wall["p2"],
  ) {
    this.id = `cmd.endpoints.${wallId}`;
  }

  execute(doc: AxonDocument): CommandResult {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return notFound(this.wallId);
    if (
      w.p1.x === this.p1.x &&
      w.p1.y === this.p1.y &&
      w.p1.z === this.p1.z &&
      w.p2.x === this.p2.x &&
      w.p2.y === this.p2.y &&
      w.p2.z === this.p2.z
    ) {
      return NOOP;
    }
    const candidate: Wall = {
      ...w,
      p1: { ...this.p1 },
      p2: { ...this.p2 },
    };
    const invalid = checkWall(doc, candidate);
    if (invalid) return invalid;
    const hosted = [
      ...doc.doors.filter((d) => d.wallId === w.id),
      ...doc.windows.filter((win) => win.wallId === w.id),
    ];
    for (const h of hosted) {
      const others = openingsOnWall(w.id, doc.doors, doc.windows, h.id);
      const fit = validateHostedOpening(asOpeningSpec(h), candidate, others);
      if (fit) return rejected(fit);
    }
    this.prev = { p1: { ...w.p1 }, p2: { ...w.p2 } };
    w.p1 = { ...this.p1 };
    w.p2 = { ...this.p2 };
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w || !this.prev) return;
    w.p1 = { ...this.prev.p1 };
    w.p2 = { ...this.prev.p2 };
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWallHeightCommand implements Command {
  readonly id: string;
  readonly type = "wall.setHeight";
  private prev = 0;

  constructor(
    private readonly wallId: string,
    private readonly height: number,
  ) {
    this.id = `cmd.height.${wallId}.${height}`;
  }

  execute(doc: AxonDocument): CommandResult {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return notFound(this.wallId);
    if (w.height === this.height) return NOOP;
    const invalid = checkWall(doc, { ...w, height: this.height });
    if (invalid) return invalid;
    this.prev = w.height;
    w.height = this.height;
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    w.height = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWallThicknessCommand implements Command {
  readonly id: string;
  readonly type = "wall.setThickness";
  private prev = 0;

  constructor(
    private readonly wallId: string,
    private readonly thickness: number,
  ) {
    this.id = `cmd.thickness.${wallId}.${thickness}`;
  }

  execute(doc: AxonDocument): CommandResult {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return notFound(this.wallId);
    if (w.thickness === this.thickness) return NOOP;
    const invalid = checkWall(doc, { ...w, thickness: this.thickness });
    if (invalid) return invalid;
    this.prev = w.thickness;
    w.thickness = this.thickness;
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    w.thickness = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWallFamilyCommand implements Command {
  readonly id: string;
  readonly type = "wall.setFamily";
  private prevFamily = "";
  private prevThickness = 0;

  constructor(
    private readonly wallId: string,
    private readonly familyId: string,
    private readonly thickness: number,
  ) {
    this.id = `cmd.family.${wallId}.${familyId}`;
  }

  execute(doc: AxonDocument): CommandResult {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return notFound(this.wallId);
    if (w.familyId === this.familyId && w.thickness === this.thickness) return NOOP;
    const invalid = checkWall(doc, {
      ...w,
      familyId: this.familyId,
      thickness: this.thickness,
    });
    if (invalid) return invalid;
    this.prevFamily = w.familyId;
    this.prevThickness = w.thickness;
    w.familyId = this.familyId;
    w.thickness = this.thickness;
    doc.meta.updatedAt = new Date().toISOString();
    return CHANGED;
  }

  undo(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    w.familyId = this.prevFamily;
    w.thickness = this.prevThickness;
    doc.meta.updatedAt = new Date().toISOString();
  }
}
