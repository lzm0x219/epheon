import { Duration } from "@epheon/primitives";
import { describe, expect, it } from "vitest";
import julianDayStandards from "../../../standards/temporal/julian-days.json";
import timeScaleStandards from "../../../standards/temporal/time-scales.json";
import invalidUtcStandards from "../../../standards/temporal/utc-invalid-inputs.json";
import { fixedDeltaT, fixedLeapSeconds, Instant, TemporalError, UtcDateTime } from "../src";
import { expectAlmostEqual } from "./helpers";

const DAY_TOLERANCE = { absolute: 1e-9 };
const SECOND_TOLERANCE = { absolute: 1e-12 };

function firstTimeScaleStandard(): (typeof timeScaleStandards.timeScaleConversions)[number] {
  const standard = timeScaleStandards.timeScaleConversions[0];

  if (standard === undefined) {
    throw new Error("Missing temporal time scale standard fixture.");
  }

  return standard;
}

describe("Instant", () => {
  it("converts UTC instants to Julian Day from standards", () => {
    for (const standard of julianDayStandards.utcInstants) {
      const instant = Instant.fromUTC(standard.input);

      expectAlmostEqual(instant.toJulianDay().toNumber(), standard.julianDay, DAY_TOLERANCE);
    }
  });

  it("honors explicit UTC offsets", () => {
    const z = Instant.fromUTC("2000-01-01T12:00:00Z");
    const plusEight = Instant.fromUTC("2000-01-01T20:00:00+08:00");

    expectAlmostEqual(
      plusEight.toJulianDay().toNumber(),
      z.toJulianDay().toNumber(),
      DAY_TOLERANCE
    );
  });

  it("rejects invalid UTC inputs from standards", () => {
    for (const standard of invalidUtcStandards.utcDateTimes) {
      const result = Instant.parseUTC(standard.input);

      expect(result.ok).toBe(false);

      if (!result.ok) {
        expect(result.error.code).toBe(standard.code);
      }

      try {
        Instant.fromUTC(standard.input);
      } catch (error) {
        expect(error).toBeInstanceOf(TemporalError);

        if (error instanceof TemporalError) {
          expect(error.code).toBe(standard.code);
        }

        continue;
      }

      throw new Error(`Expected TemporalError for ${standard.input}.`);
    }
  });

  it("accepts Gregorian leap-year dates", () => {
    expect(() => Instant.fromUTC("2024-02-29T00:00:00Z")).not.toThrow();
  });

  it("returns Result from parseUTC", () => {
    const success = Instant.parseUTC("2000-01-01T12:00:00Z");

    expect(success.ok).toBe(true);
  });

  it("returns a public UTC date-time value object", () => {
    const instant = Instant.fromUTC("2000-01-01T20:00:00+08:00");
    const utcDateTime = instant.toUTCDateTime();

    expect(utcDateTime).toBeInstanceOf(UtcDateTime);
    expect(utcDateTime.toFields()).toEqual({
      year: 2000,
      month: 1,
      day: 1,
      hour: 20,
      minute: 0,
      second: 0,
      offsetMinutes: 480
    });
  });

  it("keeps UTC field copies immutable from the caller perspective", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z");
    const fields = instant.toUTCFields() as { year: number };

    fields.year = 1900;

    expect(instant.toUTCDateTime().year).toBe(2000);
    expect(instant.toUTCFields().year).toBe(2000);
  });

  it("passes public UTC date-time objects to leap second providers", () => {
    const standard = firstTimeScaleStandard();
    let providerInput: UtcDateTime | undefined;
    const instant = Instant.fromUTC(standard.input, {
      leapSeconds: (input) => {
        providerInput = input;
        return standard.taiMinusUtcSeconds;
      }
    });

    expect(providerInput).toBeInstanceOf(UtcDateTime);
    expect(providerInput?.toFields()).toEqual(instant.toUTCFields());
    expectAlmostEqual(
      instant.toJulianEphemerisDay().toNumber(),
      standard.julianEphemerisDay,
      DAY_TOLERANCE
    );
  });

  it("requires a leap second provider before computing TT or JDE", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z");

    for (const compute of [() => instant.toTT(), () => instant.toJulianEphemerisDay()]) {
      expect(compute).toThrow(TemporalError);

      try {
        compute();
      } catch (error) {
        expect(error).toBeInstanceOf(TemporalError);

        if (error instanceof TemporalError) {
          expect(error.code).toBe("MissingLeapSecondProvider");
        }
      }
    }
  });

  it("wraps invalid leap second provider results as TemporalError", () => {
    let capturedError: unknown;

    try {
      Instant.fromUTC("2000-01-01T12:00:00Z", {
        leapSeconds: () => Number.NaN
      });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(TemporalError);

    if (capturedError instanceof TemporalError) {
      expect(capturedError.code).toBe("InvalidTimeScaleInput");
    }
  });

  it("wraps leap second provider failures as TemporalError", () => {
    let capturedError: unknown;

    try {
      Instant.fromUTC("2000-01-01T12:00:00Z", {
        leapSeconds: () => {
          throw new Error("leap second table is unavailable.");
        }
      });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(TemporalError);

    if (capturedError instanceof TemporalError) {
      expect(capturedError.code).toBe("InvalidTimeScaleInput");
    }
  });

  it("computes Julian Ephemeris Day from time scale standards", () => {
    for (const standard of timeScaleStandards.timeScaleConversions) {
      const instant = Instant.fromUTC(standard.input, {
        leapSeconds: fixedLeapSeconds(standard.taiMinusUtcSeconds)
      });

      expectAlmostEqual(instant.toJulianDay().toNumber(), standard.julianDay, DAY_TOLERANCE);
      expectAlmostEqual(
        instant.toJulianEphemerisDay().toNumber(),
        standard.julianEphemerisDay,
        DAY_TOLERANCE
      );
    }
  });

  it("computes TT and UT1 offsets from time scale standards", () => {
    for (const standard of timeScaleStandards.timeScaleConversions) {
      const instant = Instant.fromUTC(standard.input, {
        leapSeconds: fixedLeapSeconds(standard.taiMinusUtcSeconds),
        deltaT: fixedDeltaT(Duration.fromSeconds(standard.deltaTSeconds))
      });

      const tt = instant.toTT();
      const ut1 = instant.toUT1();

      expect(tt.scale).toBe("TT");
      expectAlmostEqual(tt.offsetFromUtc.toSeconds(), standard.ttMinusUtcSeconds, SECOND_TOLERANCE);
      expect(ut1.scale).toBe("UT1");
      expectAlmostEqual(
        ut1.offsetFromUtc.toSeconds(),
        standard.ut1MinusUtcSeconds,
        SECOND_TOLERANCE
      );
    }
  });

  it("requires Delta-T provider before computing UT1", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
      leapSeconds: fixedLeapSeconds(32)
    });

    expect(() => instant.toUT1()).toThrow(TemporalError);

    try {
      instant.toUT1();
    } catch (error) {
      expect(error).toBeInstanceOf(TemporalError);

      if (error instanceof TemporalError) {
        expect(error.code).toBe("MissingDeltaTProvider");
      }
    }
  });

  it("wraps Delta-T provider failures as TemporalError", () => {
    const instant = Instant.fromUTC("2000-01-01T12:00:00Z", {
      leapSeconds: fixedLeapSeconds(32),
      deltaT: () => {
        throw new Error("deltaT table is unavailable.");
      }
    });
    let capturedError: unknown;

    try {
      instant.toUT1();
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(TemporalError);

    if (capturedError instanceof TemporalError) {
      expect(capturedError.code).toBe("InvalidTimeScaleInput");
    }
  });
});
