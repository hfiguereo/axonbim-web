import { describe, expect, it } from "vitest";
import { deriveStoreyDatums } from "@axonbim/model";
import { useSessionStore } from "./createSessionStore";

describe("LR3-A active storey in session", () => {
  it("creates walls on the active storey elevation", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().document.storeys[0]!.elevation = 1.5;
    useSessionStore.getState().setTool("wall");
    useSessionStore.getState().wallClick({ x: 0, y: 0, z: 0 });
    useSessionStore.getState().wallClick({ x: 3, y: 0, z: 0 });
    const wall = useSessionStore.getState().document.walls[0]!;
    expect(wall.storeyId).toBe("storey.default");
    expect(wall.p1.z).toBe(1.5);
    expect(wall.p2.z).toBe(1.5);
  });

  it("rejects unknown active storey id", () => {
    useSessionStore.getState().newProject();
    useSessionStore.getState().setActiveStoreyId("storey.missing");
    expect(useSessionStore.getState().activeStoreyId).toBe("storey.default");
  });

  it("derives storey datums without mutating document (LR3-B)", () => {
    useSessionStore.getState().newProject();
    const doc = useSessionStore.getState().document;
    doc.storeys.push({ id: "storey.2", name: "N2", elevation: 3 });
    useSessionStore.getState().setActiveStoreyId("storey.2");
    const datums = deriveStoreyDatums(
      useSessionStore.getState().document,
      useSessionStore.getState().activeStoreyId,
    );
    expect(datums.find((d) => d.id === "storey.2")?.active).toBe(true);
  });
});
