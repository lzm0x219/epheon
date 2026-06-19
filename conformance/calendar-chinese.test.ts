import { describe, expect, it } from "vitest";
import { ganzhiOf, lunarDateOf, lunarMonthTableBetween } from "../packages/calendar-chinese/src";
import { createDeltaTProvider } from "../packages/dataset-delta-t/src";
import { createLeapSecondProvider } from "../packages/dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../packages/ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../packages/ephemerides-vsop87/src";
import { type EphemerisOptions } from "../packages/ephemerides/src";
import { Body, type Position } from "../packages/reference/src";
import { Instant } from "../packages/temporal/src";
import calendarChineseStandards from "../standards/calendar-chinese/lunar.json";

const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();
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
  leapSeconds,
  deltaT
};

describe("conformance: calendar-chinese", () => {
  it("matches the bootstrap month-table standards", () => {
    for (const sample of calendarChineseStandards.monthTables) {
      expect(
        lunarMonthTableBetween(createInstant(sample.start), createInstant(sample.end), context).map(
          (month) => ({
            year: month.year,
            month: month.month,
            isLeapMonth: month.isLeapMonth
          })
        )
      ).toEqual(sample.expectedMonths);
    }
  });

  it("matches the bootstrap lunar-date standards", () => {
    for (const sample of calendarChineseStandards.lunarDates) {
      expect(lunarDateOf(createInstant(sample.input), context)).toEqual({
        year: sample.year,
        month: sample.month,
        day: sample.day,
        isLeapMonth: sample.isLeapMonth
      });
    }
  });

  it("matches the bootstrap ganzhi standards", () => {
    for (const sample of calendarChineseStandards.ganzhi) {
      expect(ganzhiOf(createInstant(sample.input), context)).toEqual({
        year: sample.year,
        month: sample.month,
        day: sample.day,
        hour: sample.hour
      });
    }
  });
});

function createInstant(value: string): Instant {
  return Instant.fromUTC(value, {
    leapSeconds,
    deltaT
  });
}
