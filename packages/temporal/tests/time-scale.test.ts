import { Duration } from "@epheon/primitives";
import { describe, it } from "vitest";
import timeScaleStandards from "../../../standards/temporal/time-scales.json";
import { JulianDay } from "../src";
import {
  taiMinusUtcToTTMinusUtc,
  ttMinusUtcToUT1MinusUtc,
  utcJulianDayToJulianEphemerisDay
} from "../src/internal/time-scale";
import { expectAlmostEqual } from "./helpers";

const DAY_TOLERANCE = { absolute: 1e-9 };
const SECOND_TOLERANCE = { absolute: 1e-12 };

describe("time-scale pure functions", () => {
  it("converts TAI-UTC seconds to TT-UTC duration", () => {
    for (const standard of timeScaleStandards.timeScaleConversions) {
      const ttMinusUtc = taiMinusUtcToTTMinusUtc(standard.taiMinusUtcSeconds);

      expectAlmostEqual(ttMinusUtc.toSeconds(), standard.ttMinusUtcSeconds, SECOND_TOLERANCE);
    }
  });

  it("converts UTC Julian Day and TT offset to Julian Ephemeris Day", () => {
    for (const standard of timeScaleStandards.timeScaleConversions) {
      const jde = utcJulianDayToJulianEphemerisDay(
        JulianDay.fromNumber(standard.julianDay),
        Duration.fromSeconds(standard.ttMinusUtcSeconds)
      );

      expectAlmostEqual(jde.toNumber(), standard.julianEphemerisDay, DAY_TOLERANCE);
    }
  });

  it("converts TT-UTC and Delta-T to UT1-UTC", () => {
    for (const standard of timeScaleStandards.timeScaleConversions) {
      const ut1MinusUtc = ttMinusUtcToUT1MinusUtc(
        Duration.fromSeconds(standard.ttMinusUtcSeconds),
        Duration.fromSeconds(standard.deltaTSeconds)
      );

      expectAlmostEqual(ut1MinusUtc.toSeconds(), standard.ut1MinusUtcSeconds, SECOND_TOLERANCE);
    }
  });
});
