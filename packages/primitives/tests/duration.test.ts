import { describe, expect, it } from "vitest";
import durationStandards from "../../../standards/primitives/durations.json";
import { Duration, PrimitiveError } from "../src";

const TOLERANCE = { absolute: 1e-12 };

describe("Duration", () => {
  it("converts fixed time units from standards", () => {
    for (const standard of durationStandards.conversions) {
      expect(Duration.fromSeconds(standard.seconds).toDays()).toBeCloseTo(standard.days);
      expect(Duration.fromMilliseconds(standard.milliseconds).toSeconds()).toBeCloseTo(
        standard.seconds
      );
      expect(Duration.fromDays(standard.days).toSeconds()).toBeCloseTo(standard.seconds);
      expect(Duration.fromJulianYears(standard.julianYears).toSeconds()).toBeCloseTo(
        standard.seconds
      );
      expect(Duration.fromJulianCenturies(standard.julianCenturies).toSeconds()).toBeCloseTo(
        standard.seconds
      );
    }
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

  it("returns structured parse errors for non-finite values", () => {
    const result = Duration.parseSeconds(Number.NaN);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBeInstanceOf(PrimitiveError);
      expect(result.error.code).toBe("InvalidNumber");
    }
  });

  it("throws PrimitiveError from throwing constructors and invalid division", () => {
    expect(() => Duration.fromSeconds(Number.NaN)).toThrow(PrimitiveError);
    expect(() => Duration.fromDays(Number.NEGATIVE_INFINITY)).toThrow(PrimitiveError);
    expect(() => Duration.fromSeconds(1).divide(0)).toThrow(PrimitiveError);
  });
});
