import { describe, expect, it } from "vitest";
import { createDeltaTProvider } from "../packages/dataset-delta-t/src";
import { createLeapSecondProvider } from "../packages/dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../packages/ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../packages/ephemerides-vsop87/src";
import { type EphemerisOptions } from "../packages/ephemerides/src";
import {
  findLunarPhaseBetween,
  LunarPhaseKind,
  type PhenomenaContext
} from "../packages/phenomena/src";
import { Body, type Position } from "../packages/reference/src";
import { Instant } from "../packages/temporal/src";
import lunarPhaseStandards from "../standards/lunar/phases.json";

const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();
const sunProvider = createVSOP87SunProvider();
const moonProvider = createELP2000MoonProvider();
const context: PhenomenaContext = {
  ephemeris: {
    position(body: Body, instant: Instant, options?: EphemerisOptions): Position {
      return body === Body.Sun
        ? sunProvider.position(body, instant, options)
        : moonProvider.position(body, instant, options);
    }
  },
  leapSeconds,
  deltaT
};

/** 朔望时刻比较使用的容忍度：±6 小时（6h 步进 + 1s 二分法的最大理论误差）。 */
const PHASE_TIME_TOLERANCE_MS = 6 * 60 * 60 * 1000;

describe("conformance: lunar-phases", () => {
  it("matches bootstrap syzygy standards within tolerance", () => {
    for (const sample of lunarPhaseStandards.syzygies) {
      const kind = sample.type === "newMoon" ? LunarPhaseKind.NewMoon : LunarPhaseKind.FullMoon;
      const expectedMs = Date.parse(sample.instant);

      const start = createInstantFromMilliseconds(expectedMs - 2 * 24 * 60 * 60 * 1000);
      const end = createInstantFromMilliseconds(expectedMs + 2 * 24 * 60 * 60 * 1000);

      const phase = findLunarPhaseBetween(kind, start, end, context);

      expect(phase.kind).toBe(kind);
      expect(phase.targetLongitudeDifference.normalizeDegrees().toDegrees()).toBe(
        sample.expectedElongationDegrees
      );

      const actualMs = toUtcMilliseconds(phase.instant);
      const diffMs = Math.abs(actualMs - expectedMs);

      expect(
        diffMs,
        `${sample.type} at ${sample.instant}: deviation ${diffMs}ms exceeds tolerance`
      ).toBeLessThanOrEqual(PHASE_TIME_TOLERANCE_MS);
    }
  });
});

function createInstantFromMilliseconds(milliseconds: number): Instant {
  return Instant.fromUTC(new Date(milliseconds).toISOString(), {
    leapSeconds,
    deltaT
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
