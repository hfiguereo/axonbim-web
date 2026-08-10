import { describe, expect, it } from "vitest";
import {
  formatPropsNumber,
  isIncompleteNumberDraft,
  parsePropsNumberDraft,
} from "./propsNumberCommit";

describe("propsNumberCommit", () => {
  it("treats empty and trailing-dot as incomplete", () => {
    expect(isIncompleteNumberDraft("")).toBe(true);
    expect(isIncompleteNumberDraft("0.")).toBe(true);
    expect(isIncompleteNumberDraft("0.20")).toBe(false);
  });

  it("parses a typed thickness like 0.20", () => {
    expect(parsePropsNumberDraft("0.20", { min: 0.05 })).toBeCloseTo(0.2);
    expect(parsePropsNumberDraft("", { min: 0.05 })).toBeNull();
    expect(parsePropsNumberDraft("0", { min: 0.05 })).toBeNull();
    expect(parsePropsNumberDraft("0.02", { min: 0.05 })).toBeNull();
  });

  it("formats finite numbers for the draft sync", () => {
    expect(formatPropsNumber(0.15)).toBe("0.15");
    expect(formatPropsNumber(2.7)).toBe("2.7");
  });

  it("honours FOV max without requirePositive override issues", () => {
    expect(parsePropsNumberDraft("90", { min: 10, max: 120 })).toBe(90);
    expect(parsePropsNumberDraft("5", { min: 10, max: 120 })).toBeNull();
    expect(parsePropsNumberDraft("200", { min: 10, max: 120 })).toBeNull();
  });
});
