import { describe, expect, it } from "vitest";
import { TemporalError, UtcDateTime } from "../src";

describe("UtcDateTime", () => {
  it("creates immutable UTC boundary values from fields", () => {
    const fields = {
      year: 2000,
      month: 1,
      day: 1,
      hour: 20,
      minute: 0,
      second: 0,
      offsetMinutes: 480
    };
    const utcDateTime = UtcDateTime.fromFields(fields);

    fields.year = 1900;

    expect(utcDateTime.year).toBe(2000);
    expect(utcDateTime.toFields().offsetMinutes).toBe(480);
  });

  it("throws TemporalError for invalid Gregorian fields", () => {
    let capturedError: unknown;

    try {
      UtcDateTime.fromFields({
        year: 2026,
        month: 2,
        day: 29,
        hour: 0,
        minute: 0,
        second: 0,
        offsetMinutes: 0
      });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(TemporalError);

    if (capturedError instanceof TemporalError) {
      expect(capturedError.code).toBe("InvalidUTCDateTime");
    }
  });

  it("throws TemporalError for invalid numeric fields", () => {
    let capturedError: unknown;

    try {
      UtcDateTime.fromFields({
        year: 2026,
        month: 1,
        day: 1,
        hour: 0,
        minute: 0,
        second: Number.NaN,
        offsetMinutes: 0
      });
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(TemporalError);

    if (capturedError instanceof TemporalError) {
      expect(capturedError.code).toBe("InvalidUTCDateTime");
    }
  });

  it("throws TemporalError for non-integer civil date-time fields", () => {
    for (const partialFields of [
      { year: 2026.5 },
      { month: 1.5 },
      { day: 1.5 },
      { hour: 1.5 },
      { minute: 1.5 },
      { offsetMinutes: 0.5 }
    ]) {
      expect(() =>
        UtcDateTime.fromFields({
          year: 2026,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          offsetMinutes: 0,
          ...partialFields
        })
      ).toThrow(TemporalError);
    }
  });

  it("throws TemporalError for negative clock fields", () => {
    for (const partialFields of [{ hour: -1 }, { minute: -1 }, { second: -1 }]) {
      expect(() =>
        UtcDateTime.fromFields({
          year: 2026,
          month: 1,
          day: 1,
          hour: 0,
          minute: 0,
          second: 0,
          offsetMinutes: 0,
          ...partialFields
        })
      ).toThrow(TemporalError);
    }
  });
});
