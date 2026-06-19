import { describe, expect, it } from "vitest";
import lunarPhaseStandards from "../../../standards/lunar/phases.json";
import { createDeltaTProvider } from "../../dataset-delta-t/src";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../../ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../../ephemerides-vsop87/src";
import { type EphemerisOptions } from "../../ephemerides/src";
import { Duration } from "../../primitives/src";
import { Body, type Position } from "../../reference/src";
import { Instant } from "../../temporal/src";
import { findLunarPhaseBetween, LunarPhaseKind } from "../src";
import { expectInstantClose, expectNumberClose } from "./helpers";

const PHASE_TIME_TOLERANCE = Duration.fromSeconds(6 * 60 * 60);
const ELONGATION_TOLERANCE = 1e-9;
const sunProvider = createVSOP87SunProvider();
const moonProvider = createELP2000MoonProvider();
const context = {
  ephemeris: {
    position(body: Body, instant: Instant, options?: EphemerisOptions): Position {
      return body === Body.Sun
        ? sunProvider.position(body, instant, options)
        : moonProvider.position(body, instant, options);
    }
  },
  leapSeconds: createLeapSecondProvider(),
  deltaT: createDeltaTProvider()
};

describe("@epheon/phenomena lunar phases", () => {
  it("finds bootstrap new moon and full moon samples within explicit tolerance", () => {
    for (const sample of lunarPhaseStandards.syzygies) {
      const expected = Date.parse(sample.instant);
      const actual = findLunarPhaseBetween(
        sample.type === "newMoon" ? LunarPhaseKind.NewMoon : LunarPhaseKind.FullMoon,
        createWindowStart(expected),
        createWindowEnd(expected),
        context
      );

      expect(actual.kind).toBe(
        sample.type === "newMoon" ? LunarPhaseKind.NewMoon : LunarPhaseKind.FullMoon
      );
      expectNumberClose(
        actual.targetLongitudeDifference.normalizeDegrees().toDegrees(),
        sample.expectedElongationDegrees,
        ELONGATION_TOLERANCE
      );
      expectInstantClose(toUtcMilliseconds(actual.instant), expected, PHASE_TIME_TOLERANCE);
    }
  });

  it("rejects an inverted search window", () => {
    const instant = createInstant("2024-04-08T18:21:00Z", context);

    expect(() => findLunarPhaseBetween(LunarPhaseKind.NewMoon, instant, instant, context)).toThrow(
      RangeError
    );
  });
});

function createWindowStart(expected: number): Instant {
  return createInstantFromMilliseconds(expected - Duration.fromDays(2).toMilliseconds(), context);
}

function createWindowEnd(expected: number): Instant {
  return createInstantFromMilliseconds(expected + Duration.fromDays(2).toMilliseconds(), context);
}

function createInstantFromMilliseconds(
  milliseconds: number,
  context: {
    leapSeconds: ReturnType<typeof createLeapSecondProvider>;
    deltaT: ReturnType<typeof createDeltaTProvider>;
  }
): Instant {
  return createInstant(new Date(milliseconds).toISOString(), context);
}

function createInstant(
  value: string,
  context: {
    leapSeconds: ReturnType<typeof createLeapSecondProvider>;
    deltaT: ReturnType<typeof createDeltaTProvider>;
  }
): Instant {
  return Instant.fromUTC(value, {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  });
}

function toUtcMilliseconds(instant: Instant): number {
  const fields = instant.toUTCFields();
  const wholeSeconds = Math.trunc(fields.second);
  const fractionalMilliseconds = Math.round((fields.second - wholeSeconds) * 1000);

  return (
    Date.UTC(
      fields.year,
      fields.month - 1,
      fields.day,
      fields.hour,
      fields.minute,
      wholeSeconds,
      fractionalMilliseconds
    ) -
    fields.offsetMinutes * 60_000
  );
}
