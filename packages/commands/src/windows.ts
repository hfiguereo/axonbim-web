import type { AxonDocument, DoorLeafState, DoorSwing, Window } from "@axonbim/model";
import type { Command } from "./types";

let windowSeq = 0;

export function resetWindowIdSeq(n = 0): void {
  windowSeq = n;
}

export function createWindowId(): string {
  windowSeq += 1;
  return `window.${windowSeq}`;
}

export class CreateWindowCommand implements Command {
  readonly id: string;
  readonly type = "window.create";
  constructor(private readonly window: Window) {
    this.id = `cmd.window.create.${window.id}`;
  }

  execute(doc: AxonDocument): boolean {
    if (doc.windows.some((w) => w.id === this.window.id)) return false;
    if (!doc.walls.some((w) => w.id === this.window.wallId)) return false;
    doc.windows.push({ ...this.window });
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    doc.windows = doc.windows.filter((w) => w.id !== this.window.id);
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class DeleteWindowCommand implements Command {
  readonly id: string;
  readonly type = "window.delete";
  private snapshot: Window | null = null;

  constructor(private readonly windowId: string) {
    this.id = `cmd.window.delete.${windowId}`;
  }

  execute(doc: AxonDocument): boolean {
    const found = doc.windows.find((w) => w.id === this.windowId);
    if (!found) return false;
    this.snapshot = { ...found };
    doc.windows = doc.windows.filter((w) => w.id !== this.windowId);
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    if (!this.snapshot) return;
    doc.windows.push({ ...this.snapshot });
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWindowLeafStateCommand implements Command {
  readonly id: string;
  readonly type = "window.setLeafState";
  private prev: DoorLeafState = "closed";

  constructor(
    private readonly windowId: string,
    private readonly leafState: DoorLeafState,
  ) {
    this.id = `cmd.window.leaf.${windowId}.${leafState}`;
  }

  execute(doc: AxonDocument): boolean {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return false;
    const cur = w.leafState ?? "closed";
    if (cur === this.leafState) return false;
    this.prev = cur;
    w.leafState = this.leafState;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return;
    w.leafState = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWindowSwingCommand implements Command {
  readonly id: string;
  readonly type = "window.setSwing";
  private prev: DoorSwing = "positive";

  constructor(
    private readonly windowId: string,
    private readonly swing: DoorSwing,
  ) {
    this.id = `cmd.window.swing.${windowId}.${swing}`;
  }

  execute(doc: AxonDocument): boolean {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return false;
    const cur = w.swing ?? "positive";
    if (cur === this.swing) return false;
    this.prev = cur;
    w.swing = this.swing;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return;
    w.swing = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWindowHingeCommand implements Command {
  readonly id: string;
  readonly type = "window.setHinge";
  private prev: Window["hinge"] = "start";

  constructor(
    private readonly windowId: string,
    private readonly hinge: Window["hinge"],
  ) {
    this.id = `cmd.window.hinge.${windowId}.${hinge}`;
  }

  execute(doc: AxonDocument): boolean {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return false;
    if (w.hinge === this.hinge) return false;
    this.prev = w.hinge;
    w.hinge = this.hinge;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return;
    w.hinge = this.prev;
    doc.meta.updatedAt = new Date().toISOString();
  }
}

export class SetWindowFamilyCommand implements Command {
  readonly id: string;
  readonly type = "window.setFamily";
  private prevFamily = "";
  private prevWidth = 0;
  private prevHeight = 0;
  private prevSill = 0;

  constructor(
    private readonly windowId: string,
    private readonly familyId: string,
    private readonly width: number,
    private readonly height: number,
    private readonly sill: number,
  ) {
    this.id = `cmd.window.family.${windowId}.${familyId}`;
  }

  execute(doc: AxonDocument): boolean {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return false;
    if (
      w.familyId === this.familyId &&
      w.width === this.width &&
      w.height === this.height &&
      w.sill === this.sill
    ) {
      return false;
    }
    this.prevFamily = w.familyId;
    this.prevWidth = w.width;
    this.prevHeight = w.height;
    this.prevSill = w.sill;
    w.familyId = this.familyId;
    w.width = this.width;
    w.height = this.height;
    w.sill = this.sill;
    doc.meta.updatedAt = new Date().toISOString();
    return true;
  }

  undo(doc: AxonDocument): void {
    const w = doc.windows.find((x) => x.id === this.windowId);
    if (!w) return;
    w.familyId = this.prevFamily;
    w.width = this.prevWidth;
    w.height = this.prevHeight;
    w.sill = this.prevSill;
    doc.meta.updatedAt = new Date().toISOString();
  }
}
