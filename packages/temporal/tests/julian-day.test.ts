import { describe, expect, it } from "vitest";
import { JulianDay, JulianEphemerisDay, TemporalError } from "../src";

describe("JulianDay", () => {
  it("returns Result from parseNumber", () => {
    const success = JulianDay.parseNumber(2451545);
    const failure = JulianDay.parseNumber(Number.NaN);

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);

    if (!failure.ok) {
      expect(failure.error).toBeInstanceOf(TemporalError);
      expect(failure.error.code).toBe("InvalidJulianDay");
    }
  });

  it("throws TemporalError from fromNumber", () => {
    expect(() => JulianDay.fromNumber(Number.POSITIVE_INFINITY)).toThrow(TemporalError);
    expect(() => JulianEphemerisDay.fromNumber(Number.NEGATIVE_INFINITY)).toThrow(TemporalError);
  });

  it("parses Julian Ephemeris Day with the same structured error model", () => {
    const success = JulianEphemerisDay.parseNumber(2451545.0003725);
    const failure = JulianEphemerisDay.parseNumber(Number.NaN);

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);

    if (!failure.ok) {
      expect(failure.error.code).toBe("InvalidJulianDay");
    }
  });
});
