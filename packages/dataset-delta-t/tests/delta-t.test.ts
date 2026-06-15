import { Instant, TemporalError } from "@epheon/temporal";
import { describe, expect, it } from "vitest";
import { createDeltaTProvider, deltaTDatasetInfo } from "../src";
import { expectAlmostEqual } from "./helpers";

const SECOND_TOLERANCE = { absolute: 2 };

describe("@epheon/dataset-delta-t", () => {
  it("exports dataset metadata", () => {
    expect(deltaTDatasetInfo.id).not.toBe("");
    expect(deltaTDatasetInfo.source.length).toBeGreaterThan(0);
    expect(deltaTDatasetInfo.coverageStart).toMatch(/Z$/);
    expect(deltaTDatasetInfo.coverageEnd).toMatch(/Z$/);
  });

  it("returns plausible Delta-T values for modern instants", () => {
    const provider = createDeltaTProvider();

    expectAlmostEqual(
      provider(Instant.fromUTC("1999-01-01T00:00:00Z")).toSeconds(),
      63.83,
      SECOND_TOLERANCE
    );
    expectAlmostEqual(
      provider(Instant.fromUTC("2000-01-01T12:00:00Z")).toSeconds(),
      64,
      SECOND_TOLERANCE
    );
    expectAlmostEqual(
      provider(Instant.fromUTC("2017-01-01T00:00:00Z")).toSeconds(),
      68.592,
      SECOND_TOLERANCE
    );
  });

  it("honors explicit UTC offsets", () => {
    const provider = createDeltaTProvider();
    const z = provider(Instant.fromUTC("2000-01-01T12:00:00Z")).toSeconds();
    const plusEight = provider(Instant.fromUTC("2000-01-01T20:00:00+08:00")).toSeconds();

    expectAlmostEqual(plusEight, z, { absolute: 1e-9 });
  });

  it("fails outside the declared coverage", () => {
    const provider = createDeltaTProvider();

    expect(() => provider(Instant.fromUTC("1599-12-31T23:59:59Z"))).toThrow(TemporalError);
  });
});
