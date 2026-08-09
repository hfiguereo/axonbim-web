import { describe, expect, it } from "vitest";
import { emptySnapSession } from "./snap";
import { restartChainAt } from "./wallChain";

describe("restartChainAt (LR1-B)", () => {
  it("starts a new chain at the point without document semantics", () => {
    const next = restartChainAt({ x: 3, y: 4, z: 0.5 });
    expect(next.wallChain).toBe(true);
    expect(next.wallPending).toEqual({ x: 3, y: 4, z: 0.5 });
    expect(next.wallChainOrigin).toEqual({ x: 3, y: 4, z: 0.5 });
    expect(next.wallHover).toEqual({ x: 3, y: 4, z: 0.5 });
    expect(next.snapSession).toEqual(emptySnapSession());
    expect(next.lastSnapKind).toBe("none");
  });

  it("copies the point (no shared reference)", () => {
    const p = { x: 1, y: 2, z: 0 };
    const next = restartChainAt(p);
    p.x = 99;
    expect(next.wallPending?.x).toBe(1);
    expect(next.wallChainOrigin?.x).toBe(1);
  });
});
