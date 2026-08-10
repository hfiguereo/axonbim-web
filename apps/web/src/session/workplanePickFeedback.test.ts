import { describe, expect, it } from "vitest";
import {
  shouldReportWorkplanePickMiss,
  WORKPLANE_PICK_MISS_STATUS,
} from "./workplanePickFeedback";

describe("H4 workplanePickFeedback", () => {
  it("reports miss during sketch / Modificar / wall / workplane tools", () => {
    expect(
      shouldReportWorkplanePickMiss({
        sketchTarget: true,
        sketchModifyLive: false,
        activeTool: "select",
      }),
    ).toBe(true);
    expect(
      shouldReportWorkplanePickMiss({
        sketchTarget: false,
        sketchModifyLive: true,
        activeTool: "wall",
      }),
    ).toBe(true);
    expect(
      shouldReportWorkplanePickMiss({
        sketchTarget: false,
        sketchModifyLive: false,
        activeTool: "wall",
      }),
    ).toBe(true);
    expect(
      shouldReportWorkplanePickMiss({
        sketchTarget: false,
        sketchModifyLive: false,
        activeTool: "workplaneLine",
      }),
    ).toBe(true);
  });

  it("does not report for unrelated tools", () => {
    expect(
      shouldReportWorkplanePickMiss({
        sketchTarget: false,
        sketchModifyLive: false,
        activeTool: "door",
      }),
    ).toBe(false);
    expect(WORKPLANE_PICK_MISS_STATUS).toMatch(/Workplane/i);
  });
});
