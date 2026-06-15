import { Duration } from "@epheon/primitives";
import { describe, it } from "vitest";
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
    const ttMinusUtc = taiMinusUtcToTTMinusUtc(32);

    expectAlmostEqual(ttMinusUtc.toSeconds(), 64.184, SECOND_TOLERANCE);
  });

  it("converts UTC Julian Day and TT offset to Julian Ephemeris Day", () => {
    const jde = utcJulianDayToJulianEphemerisDay(
      JulianDay.fromNumber(2451545),
      Duration.fromSeconds(64.184)
    );

    expectAlmostEqual(jde.toNumber(), 2451545.0007428704, DAY_TOLERANCE);
  });

  it("converts TT-UTC and Delta-T to UT1-UTC", () => {
    const ut1MinusUtc = ttMinusUtcToUT1MinusUtc(
      Duration.fromSeconds(64.184),
      Duration.fromSeconds(64)
    );

    expectAlmostEqual(ut1MinusUtc.toSeconds(), 0.184, SECOND_TOLERANCE);
  });
});
