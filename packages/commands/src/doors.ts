import type { AxonDocument, Door, DoorLeafState, DoorSwing } from "@axonbim/model";
import type { Command } from "./types";

let doorSeq = 0;

export function resetDoorIdSeq(n = 0): void {
  doorSeq = n;
}

export function createDoorId(): string {
  doorSeq += 1;
  return `door.${doorSeq}`;
}

export class CreateDoorCommand implements Command {
  readonly id: string;
  readonly type = "door.create";
  constructor(private readonly door: Door) {
    this.id = `cmd.door.create.${door.id}`;
  }

  execute(doc: AxonDocument): boolean {
    if (doc.doors.some((d) => d.id === this.door.id)) return false;
    if (!doc.walls.some((w) => w.id === this.door.wallId)) return false;
    doc.doors.push({ ...this.door });
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    doc.doors = doc.doors.filter((d) => d.id !== this.door.id);
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class DeleteDoorCommand implements Command {
  readonly id: string;
  readonly type = "door.delete";
  private snapshot: Door | null = null;

  constructor(private readonly doorId: string) {
    this.id = `cmd.door.delete.${doorId}`;
  }

  execute(doc: AxonDocument): boolean {
    const found = doc.doors.find((d) => d.id === this.doorId);
    if (!found) return false;
    this.snapshot = { ...found };
    doc.doors = doc.doors.filter((d) => d.id !== this.doorId);
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    if (!this.snapshot) return;
    doc.doors.push({ ...this.snapshot });
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetDoorLeafStateCommand implements Command {
  readonly id: string;
  readonly type = "door.setLeafState";
  private prev: DoorLeafState = "open";

  constructor(
    private readonly doorId: string,
    private readonly leafState: DoorLeafState,
  ) {
    this.id = `cmd.door.leaf.${doorId}.${leafState}`;
  }

  execute(doc: AxonDocument): boolean {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return false;
    const cur = d.leafState ?? "open";
    if (cur === this.leafState) return false;
    this.prev = cur;
    d.leafState = this.leafState;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return;
    d.leafState = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetDoorSwingCommand implements Command {
  readonly id: string;
  readonly type = "door.setSwing";
  private prev: DoorSwing = "positive";

  constructor(
    private readonly doorId: string,
    private readonly swing: DoorSwing,
  ) {
    this.id = `cmd.door.swing.${doorId}.${swing}`;
  }

  execute(doc: AxonDocument): boolean {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return false;
    const cur = d.swing ?? "positive";
    if (cur === this.swing) return false;
    this.prev = cur;
    d.swing = this.swing;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return;
    d.swing = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetDoorHingeCommand implements Command {
  readonly id: string;
  readonly type = "door.setHinge";
  private prev: Door["hinge"] = "start";

  constructor(
    private readonly doorId: string,
    private readonly hinge: Door["hinge"],
  ) {
    this.id = `cmd.door.hinge.${doorId}.${hinge}`;
  }

  execute(doc: AxonDocument): boolean {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return false;
    if (d.hinge === this.hinge) return false;
    this.prev = d.hinge;
    d.hinge = this.hinge;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return;
    d.hinge = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetDoorFamilyCommand implements Command {
  readonly id: string;
  readonly type = "door.setFamily";
  private prevFamily = "";
  private prevWidth = 0;
  private prevHeight = 0;

  constructor(
    private readonly doorId: string,
    private readonly familyId: string,
    private readonly width: number,
    private readonly height: number,
  ) {
    this.id = `cmd.door.family.${doorId}.${familyId}`;
  }

  execute(doc: AxonDocument): boolean {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return false;
    if (
      d.familyId === this.familyId &&
      d.width === this.width &&
      d.height === this.height
    ) {
      return false;
    }
    this.prevFamily = d.familyId;
    this.prevWidth = d.width;
    this.prevHeight = d.height;
    d.familyId = this.familyId;
    d.width = this.width;
    d.height = this.height;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const d = doc.doors.find((x) => x.id === this.doorId);
    if (!d) return;
    d.familyId = this.prevFamily;
    d.width = this.prevWidth;
    d.height = this.prevHeight;
    doc.meta.updatedAt = new Date().toISOString();
  }
}
