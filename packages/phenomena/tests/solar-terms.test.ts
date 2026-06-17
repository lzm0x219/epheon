import { describe, expect, it } from "vitest";
import solarTermStandards from "../../../standards/solar/terms.json";
import { createDeltaTProvider } from "../../dataset-delta-t/src";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { createVSOP87SunProvider } from "../../ephemerides-vsop87/src";
import { Duration } from "../../primitives/src";
import { SolarTermName, solarTermsOfYear } from "../src";
import { expectInstantClose, expectNumberClose } from "./helpers";

const TERM_TIME_TOLERANCE = Duration.fromSeconds(30 * 60);
const LONGITUDE_TOLERANCE = 1e-9;

describe("@epheon/phenomena", () => {
  const context = {
    ephemeris: createVSOP87SunProvider(),
    leapSeconds: createLeapSecondProvider(),
    deltaT: createDeltaTProvider()
  };

  it("returns the 24 solar terms of a UTC year in chronological order", () => {
    const terms = solarTermsOfYear(2024, context);

    expect(terms).toHaveLength(24);
    expect(terms[0]?.name).toBe(SolarTermName.XiaoHan);
    expect(terms[23]?.name).toBe(SolarTermName.DongZhi);

    for (let index = 1; index < terms.length; index += 1) {
      const previous = toUtcMilliseconds(terms[index - 1]!.instant);
      const current = toUtcMilliseconds(terms[index]!.instant);

      expect(current).toBeGreaterThan(previous);
    }
  });

  it("matches bootstrap standards for 2024 and 2025 within explicit time tolerance", () => {
    for (const year of [2024, 2025] as const) {
      const actual = solarTermsOfYear(year, context);
      const expected = solarTermStandards.solarTerms.filter((sample) => sample.year === year);

      expect(actual).toHaveLength(expected.length);

      for (let index = 0; index < expected.length; index += 1) {
        const actualTerm = actual[index]!;
        const expectedTerm = expected[index]!;

        expect(actualTerm.name).toBe(expectedTerm.name);
        expectNumberClose(
          actualTerm.targetLongitude.normalizeDegrees().toDegrees(),
          expectedTerm.targetLongitudeDegrees,
          LONGITUDE_TOLERANCE
        );
        expectInstantClose(
          toUtcMilliseconds(actualTerm.instant),
          Date.parse(expectedTerm.instant),
          TERM_TIME_TOLERANCE
        );
      }
    }
  });
});

function toUtcMilliseconds(instant: { toUTCFields(): { [key: string]: number } }): number {
  const fields = instant.toUTCFields() as {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    offsetMinutes: number;
  };
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
