import { describe, expect, it } from "vitest";
import { fixedLeapSeconds, Instant, TemporalError } from "../src";

describe("Instant", () => {
  it("converts a known UTC instant to Julian Day", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z");

    expect(instant.toJulianDay().toNumber()).toBe(2451545);
  });

  it("honors explicit UTC offsets", () => {
    const z = Instant.fromUTC("2000-01-01T12:00:00Z");
    const plusEight = Instant.fromUTC("2000-01-01T20:00:00+08:00");

    expect(plusEight.toJulianDay().toNumber()).toBeCloseTo(z.toJulianDay().toNumber());
  });

  it("rejects implicit local time", () => {
    expect(() => Instant.fromUTC("2000-01-01T12:00:00")).toThrow(TemporalError);
  });

  it("rejects invalid Gregorian calendar dates", () => {
    expect(() => Instant.fromUTC("2026-02-29T00:00:00Z")).toThrow(TemporalError);
    expect(() => Instant.fromUTC("2024-02-29T00:00:00Z")).not.toThrow();
  });

  it("returns Result from parseUTC", () => {
    const success = Instant.parseUTC("2000-01-01T12:00:00Z");
    const failure = Instant.parseUTC("2000-01-01T12:00:00");

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);

    if (!failure.ok) {
      expect(failure.error.code).toBe("InvalidUTCDateTime");
    }
  });

  it("computes Julian Ephemeris Day using injected leap seconds", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
      leapSeconds: fixedLeapSeconds(32)
    });

    expect(instant.toJulianEphemerisDay().toNumber()).toBeCloseTo(2451545 + (32 + 32.184) / 86400);
  });
});
