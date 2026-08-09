import { beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "./createSessionStore";

describe("presentation crop save/load", () => {
  beforeEach(() => {
    useSessionStore.getState().newProject();
  });

  it("export → open restores enabled plan crop", () => {
    useSessionStore.getState().setActiveView("view.plan.level1");
    useSessionStore.getState().setActiveViewCrop({
      enabled: true,
      minX: 1,
      minY: 2,
      maxX: 5,
      maxY: 6,
    });

    const text = useSessionStore.getState().exportText();
    expect(text).toContain("presentation");
    expect(text).toContain("view.plan.level1");

    useSessionStore.getState().newProject();
    expect(
      useSessionStore.getState().views.find((v) => v.id === "view.plan.level1")?.crop,
    ).toBeUndefined();

    useSessionStore.getState().openFromText(text, "con-crop.axon");
    const plan = useSessionStore.getState().views.find((v) => v.id === "view.plan.level1");
    expect(plan?.crop).toEqual({
      enabled: true,
      minX: 1,
      minY: 2,
      maxX: 5,
      maxY: 6,
    });
  });
});
