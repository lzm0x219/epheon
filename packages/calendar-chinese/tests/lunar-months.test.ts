import { describe, expect, it } from "vitest";
import { createDeltaTProvider } from "../../dataset-delta-t/src";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../../ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../../ephemerides-vsop87/src";
import { type EphemerisOptions } from "../../ephemerides/src";
import { Body, type Position } from "../../reference/src";
import { Instant } from "../../temporal/src";
import { buildLunarMonthSequence, lunarMonthTableBetween, lunarMonthTableOfYear } from "../src";

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

  it("rejects an inverted month-table window", () => {
    const instant = createInstant("2024-02-01T00:00:00Z");

    expect(() => lunarMonthTableBetween(instant, instant, context)).toThrow(RangeError);
  });

  it("rejects a non-integer UTC year", () => {
    expect(() => lunarMonthTableOfYear(2024.5, context)).toThrow(RangeError);
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
