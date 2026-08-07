import type { AxonDocument, Wall } from "@axonbim/model";
import type { Command } from "./types";

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

export class CreateWallCommand implements Command {
  readonly id: string;
  readonly type = "wall.create";
  constructor(private readonly wall: Wall) {
    this.id = `cmd.create.${wall.id}`;
  }

  execute(doc: AxonDocument): void {
    if (doc.walls.some((w) => w.id === this.wall.id)) return;
    doc.walls.push({ ...this.wall, p1: { ...this.wall.p1 }, p2: { ...this.wall.p2 } });
    doc.meta.updatedAt = new Date().toISOString();
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

  constructor(private readonly wallId: string) {
    this.id = `cmd.delete.${wallId}`;
  }

  execute(doc: AxonDocument): void {
    const found = doc.walls.find((w) => w.id === this.wallId);
    if (!found) return;
    this.snapshot = {
      ...found,
      p1: { ...found.p1 },
      p2: { ...found.p2 },
    };
    doc.walls = doc.walls.filter((w) => w.id !== this.wallId);
    doc.doors = doc.doors.filter((d) => d.wallId !== this.wallId);
    doc.meta.updatedAt = new Date().toISOString();
  }

  undo(doc: AxonDocument): void {
    if (!this.snapshot) return;
    doc.walls.push({
      ...this.snapshot,
      p1: { ...this.snapshot.p1 },
      p2: { ...this.snapshot.p2 },
    });
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

  execute(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    this.prev = w.height;
    w.height = this.height;
    doc.meta.updatedAt = new Date().toISOString();
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

  execute(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    this.prev = w.thickness;
    w.thickness = this.thickness;
    doc.meta.updatedAt = new Date().toISOString();
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

  execute(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    this.prevFamily = w.familyId;
    this.prevThickness = w.thickness;
    w.familyId = this.familyId;
    w.thickness = this.thickness;
    doc.meta.updatedAt = new Date().toISOString();
  }

  undo(doc: AxonDocument): void {
    const w = doc.walls.find((x) => x.id === this.wallId);
    if (!w) return;
    w.familyId = this.prevFamily;
    w.thickness = this.prevThickness;
    doc.meta.updatedAt = new Date().toISOString();
  }
}
