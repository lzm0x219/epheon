import { describe, expect, it } from "vitest";
import { Duration } from "../src";

const TOLERANCE = { absolute: 1e-12 };

describe("Duration", () => {
  it("converts fixed time units", () => {
    expect(Duration.fromDays(1).toSeconds()).toBe(86400);
    expect(Duration.fromMilliseconds(1500).toSeconds()).toBe(1.5);
    expect(Duration.fromJulianYears(1).toDays()).toBe(365.25);
    expect(Duration.fromJulianCenturies(1).toDays()).toBe(36525);
  });

  it("keeps values immutable during arithmetic", () => {
    const original = Duration.fromSeconds(10);
    const result = original.add(Duration.fromSeconds(5));

    expect(original.toSeconds()).toBe(10);
    expect(result.toSeconds()).toBe(15);
  });

  it("requires explicit tolerance for approximate equality", () => {
    const a = Duration.fromDays(0.5);
    const b = Duration.fromSeconds(43200);

    expect(a.almostEquals(b, TOLERANCE)).toBe(true);
  });

  it("rejects non-finite values and invalid division", () => {
    expect(() => Duration.fromSeconds(Number.NaN)).toThrow(TypeError);
    expect(() => Duration.fromDays(Number.NEGATIVE_INFINITY)).toThrow(TypeError);
    expect(() => Duration.fromSeconds(1).divide(0)).toThrow(RangeError);
  });
});
