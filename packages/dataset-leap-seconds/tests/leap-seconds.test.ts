import { Instant, TemporalError } from "@epheon/temporal";
import { describe, expect, it } from "vitest";
import { createLeapSecondProvider, leapSecondDatasetInfo } from "../src";

describe("@epheon/dataset-leap-seconds", () => {
  it("exports dataset metadata", () => {
    expect(leapSecondDatasetInfo.id).not.toBe("");
    expect(leapSecondDatasetInfo.source.length).toBeGreaterThan(0);
    expect(leapSecondDatasetInfo.coverageStart).toMatch(/Z$/);
    expect(leapSecondDatasetInfo.coverageEnd).toMatch(/Z$/);
  });

  it("returns known TAI-UTC values for historical instants", () => {
    const provider = createLeapSecondProvider();

    expect(provider(Instant.fromUTC("1972-01-01T00:00:00Z").toUTCDateTime())).toBe(10);
    expect(provider(Instant.fromUTC("2000-01-01T12:00:00Z").toUTCDateTime())).toBe(32);
    expect(provider(Instant.fromUTC("2017-01-01T00:00:00Z").toUTCDateTime())).toBe(37);
  });

  it("honors explicit UTC offsets", () => {
    const provider = createLeapSecondProvider();

    expect(provider(Instant.fromUTC("2017-01-01T08:00:00+08:00").toUTCDateTime())).toBe(37);
  });

  it("fails outside the declared coverage", () => {
    const provider = createLeapSecondProvider();

    expect(() => provider(Instant.fromUTC("1971-12-31T23:59:59Z").toUTCDateTime())).toThrow(
      TemporalError
    );
  });
});
