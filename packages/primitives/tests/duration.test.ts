import { describe, expect, it } from "vitest";
import durationStandards from "../../../standards/primitives/durations.json";
import { Duration, PrimitiveError } from "../src";
import { expectAlmostEqual, expectPrimitiveErrorCode } from "./helpers";

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

  it("handles arithmetic boundary methods", () => {
    const duration = Duration.fromSeconds(-30);

    expect(duration.subtract(Duration.fromSeconds(15)).toSeconds()).toBe(-45);
    expect(duration.multiply(2).toSeconds()).toBe(-60);
    expect(duration.divide(2).toSeconds()).toBe(-15);
    expect(duration.negate().toSeconds()).toBe(30);
    expect(duration.abs().toSeconds()).toBe(30);
    expect(duration.equals(Duration.fromSeconds(-30))).toBe(true);
    expect(duration.equals(Duration.fromSeconds(30))).toBe(false);
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

  it("reports stable error codes for invalid arithmetic inputs", () => {
    expectPrimitiveErrorCode(() => Duration.fromSeconds(1).multiply(Number.NaN), "InvalidNumber");
    expectPrimitiveErrorCode(() => Duration.fromSeconds(1).divide(0), "DivisionByZero");
  });
});
