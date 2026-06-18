import { describe, expect, it } from "vitest";
import { createDeltaTProvider } from "../../dataset-delta-t/src";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../../ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../../ephemerides-vsop87/src";
import { type EphemerisOptions } from "../../ephemerides/src";
import { Body, type Position } from "../../reference/src";
import { Instant } from "../../temporal/src";
import {
  buildLunarMonthSequence,
  ganzhiOf,
  lunarDateOf,
  lunarMonthTableBetween,
  lunarMonthTableOfYear
} from "../src";

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

describe("@epheon/calendar-chinese", () => {
  it("marks the first lunation without a principal term as the leap month", () => {
    const months = buildLunarMonthSequence(
      [
        createInstant("2024-01-01T00:00:00Z"),
        createInstant("2024-01-30T00:00:00Z"),
        createInstant("2024-02-28T00:00:00Z"),
        createInstant("2024-03-29T00:00:00Z"),
        createInstant("2024-04-27T00:00:00Z")
      ],
      [
        createInstant("2024-01-15T00:00:00Z"),
        createInstant("2024-02-15T00:00:00Z"),
        createInstant("2024-04-15T00:00:00Z")
      ]
    );

    expect(months).toHaveLength(4);
    expect(months.map((month) => month.containsPrincipalTerm)).toEqual([true, true, false, true]);
    expect(months.map((month) => month.isLeapMonth)).toEqual([false, false, true, false]);
    expect(toUtcMilliseconds(months[2]!.start)).toBe(Date.parse("2024-02-28T00:00:00Z"));
    expect(toUtcMilliseconds(months[2]!.end)).toBe(Date.parse("2024-03-29T00:00:00Z"));
  });

  it("rejects non-increasing new moon starts", () => {
    expect(() =>
      buildLunarMonthSequence(
        [createInstant("2024-01-30T00:00:00Z"), createInstant("2024-01-01T00:00:00Z")],
        []
      )
    ).toThrow(RangeError);
  });

  it("returns a chronological lunar month table for a UTC year", () => {
    const months = lunarMonthTableOfYear(2024, context);

    expect(months.length).toBeGreaterThan(0);
    expect(months[0]?.sequence).toBe(1);

    for (let index = 1; index < months.length; index += 1) {
      const previous = months[index - 1]!;
      const current = months[index]!;

      expect(current.sequence).toBe(previous.sequence + 1);
      expect(toUtcMilliseconds(current.start)).toBe(toUtcMilliseconds(previous.end));
      expect(toUtcMilliseconds(current.start)).toBeGreaterThan(toUtcMilliseconds(previous.start));
    }
  });

  it("returns only the months overlapping the requested UTC window", () => {
    const start = createInstant("2024-02-01T00:00:00Z");
    const end = createInstant("2024-05-01T00:00:00Z");
    const months = lunarMonthTableBetween(start, end, context);

    expect(months.length).toBeGreaterThan(0);

    for (const month of months) {
      expect(toUtcMilliseconds(month.end)).toBeGreaterThan(toUtcMilliseconds(start));
      expect(toUtcMilliseconds(month.start)).toBeLessThan(toUtcMilliseconds(end));
    }
  });

  it("includes lunar year and month numbering across the 2024 new-year boundary", () => {
    const months = lunarMonthTableBetween(
      createInstant("2024-01-01T00:00:00+08:00"),
      createInstant("2024-04-01T00:00:00+08:00"),
      context
    );

    expect(
      months.map((month) => ({
        year: month.year,
        month: month.month,
        isLeapMonth: month.isLeapMonth
      }))
    ).toEqual([
      { year: 2023, month: 11, isLeapMonth: false },
      { year: 2023, month: 12, isLeapMonth: false },
      { year: 2024, month: 1, isLeapMonth: false },
      { year: 2024, month: 2, isLeapMonth: false }
    ]);
  });

  it("keeps leap-month numbering on the month table for the 2023 leap second month", () => {
    const months = lunarMonthTableBetween(
      createInstant("2023-02-01T00:00:00+08:00"),
      createInstant("2023-05-01T00:00:00+08:00"),
      context
    );

    expect(
      months.map((month) => ({
        year: month.year,
        month: month.month,
        isLeapMonth: month.isLeapMonth
      }))
    ).toEqual([
      { year: 2023, month: 1, isLeapMonth: false },
      { year: 2023, month: 2, isLeapMonth: false },
      { year: 2023, month: 2, isLeapMonth: true },
      { year: 2023, month: 3, isLeapMonth: false }
    ]);
  });

  it("rejects an inverted month-table window", () => {
    const instant = createInstant("2024-02-01T00:00:00Z");

    expect(() => lunarMonthTableBetween(instant, instant, context)).toThrow(RangeError);
  });

  it("rejects a non-integer UTC year", () => {
    expect(() => lunarMonthTableOfYear(2024.5, context)).toThrow(RangeError);
  });

  it("returns lunar new year day for the 2024 spring festival sample", () => {
    const lunarDate = lunarDateOf(createInstant("2024-02-10T12:00:00+08:00"), context);

    expect(lunarDate).toEqual({
      year: 2024,
      month: 1,
      day: 1,
      isLeapMonth: false
    });
  });

  it("keeps the previous lunar year before the 2024 spring festival boundary", () => {
    const lunarDate = lunarDateOf(createInstant("2024-02-09T12:00:00+08:00"), context);

    expect(lunarDate).toEqual({
      year: 2023,
      month: 12,
      day: 30,
      isLeapMonth: false
    });
  });

  it("marks the 2023 leap second month sample as a leap month", () => {
    const lunarDate = lunarDateOf(createInstant("2023-03-22T12:00:00+08:00"), context);

    expect(lunarDate).toEqual({
      year: 2023,
      month: 2,
      day: 1,
      isLeapMonth: true
    });
  });

  it("returns the four pillars for the 2024 spring festival sample", () => {
    expect(ganzhiOf(createInstant("2024-02-10T12:00:00+08:00"), context)).toEqual({
      year: { stem: "甲", branch: "辰", name: "甲辰" },
      month: { stem: "丙", branch: "寅", name: "丙寅" },
      day: { stem: "甲", branch: "辰", name: "甲辰" },
      hour: { stem: "庚", branch: "午", name: "庚午" }
    });
  });

  it("switches ganzhi year and month at the 2024 lichun boundary", () => {
    expect(ganzhiOf(createInstant("2024-02-04T12:00:00+08:00"), context)).toMatchObject({
      year: { name: "癸卯" },
      month: { name: "乙丑" }
    });
    expect(ganzhiOf(createInstant("2024-02-04T18:00:00+08:00"), context)).toMatchObject({
      year: { name: "甲辰" },
      month: { name: "丙寅" }
    });
  });
});

function createInstant(value: string): Instant {
  return Instant.fromUTC(value, {
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
