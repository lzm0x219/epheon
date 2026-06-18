import { describe, expect, it } from "vitest";
import { createDeltaTProvider } from "../packages/dataset-delta-t/src";
import { createLeapSecondProvider } from "../packages/dataset-leap-seconds/src";
import { createVSOP87SunProvider } from "../packages/ephemerides-vsop87/src";
import { type EphemerisOptions } from "../packages/ephemerides/src";
import { solarTermsOfYear, type PhenomenaContext } from "../packages/phenomena/src";
import { Body, type Position } from "../packages/reference/src";
import { Instant } from "../packages/temporal/src";
import solarTermStandards from "../standards/solar/terms.json";

const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();
const sunProvider = createVSOP87SunProvider();
const context: PhenomenaContext = {
  ephemeris: {
    position(body: Body, instant: Instant, options?: EphemerisOptions): Position {
      return sunProvider.position(body, instant, options);
    }
  },
  leapSeconds,
  deltaT
};

/** 节气时刻比较使用的容忍度：±15 分钟（VSOP87 低阶模型 vs JPL Horizons 的典型偏差）。 */
const TERM_TIME_TOLERANCE_MS = 15 * 60 * 1000;

describe("conformance: solar-terms", () => {
  it("matches JPL Horizons solar-term standards within tolerance", () => {
    for (const sample of solarTermStandards.solarTerms) {
      const terms = solarTermsOfYear(sample.year, context);
      const term = terms.find((t) => t.name === sample.name);

      expect(term, `节气 ${sample.name} (${sample.year}) 未找到`).toBeDefined();

      const expectedMs = Date.parse(sample.instant);
      const actualMs = toUtcMilliseconds(term!.instant);
      const diffMs = Math.abs(actualMs - expectedMs);

      expect(
        diffMs,
        `节气 ${sample.name} (${sample.year}) 时刻偏差 ${diffMs}ms 超过容忍度 ±${TERM_TIME_TOLERANCE_MS}ms`
      ).toBeLessThanOrEqual(TERM_TIME_TOLERANCE_MS);
    }
  });
});

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
