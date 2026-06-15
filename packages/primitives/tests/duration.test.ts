import { describe, expect, it } from "vitest";
import durationStandards from "../../../standards/primitives/durations.json";
import { Duration, PrimitiveError } from "../src";
import { expectAlmostEqual } from "./helpers";

const TOLERANCE = { absolute: 1e-12 };

describe("Duration", () => {
  it("converts fixed time units from standards", () => {
    for (const standard of durationStandards.conversions) {
      expectAlmostEqual(Duration.fromSeconds(standard.seconds).toDays(), standard.days, TOLERANCE);
      expectAlmostEqual(
        Duration.fromMilliseconds(standard.milliseconds).toSeconds(),
        standard.seconds,
        TOLERANCE
      );
      expectAlmostEqual(Duration.fromDays(standard.days).toSeconds(), standard.seconds, TOLERANCE);
      expectAlmostEqual(
        Duration.fromJulianYears(standard.julianYears).toSeconds(),
        standard.seconds,
        TOLERANCE
      );
      expectAlmostEqual(
        Duration.fromJulianCenturies(standard.julianCenturies).toSeconds(),
        standard.seconds,
        TOLERANCE
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
