import { describe, expect, it } from "vitest";
import { createDeltaTProvider } from "../../dataset-delta-t/src";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { Instant } from "../../temporal/src";
import { buildLunarMonthSequence } from "../src";

const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();

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
