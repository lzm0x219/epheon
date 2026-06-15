import { describe, expect, it } from "vitest";
import { almostEqual, PrimitiveError } from "../src";
import { expectPrimitiveErrorCode } from "./helpers";

describe("almostEqual", () => {
  it("uses absolute and relative tolerance", () => {
    expect(almostEqual(1, 1.001, { absolute: 0.01 })).toBe(true);
    expect(almostEqual(1000, 1001, { absolute: 0, relative: 0.002 })).toBe(true);
    expect(almostEqual(1000, 1001, { absolute: 0.5, relative: 0.002 })).toBe(true);
    expect(almostEqual(1, 1.1, { absolute: 0.01 })).toBe(false);
  });

  it("rejects invalid tolerance", () => {
    expect(() => almostEqual(1, 1, { absolute: -1 })).toThrow(PrimitiveError);
    expect(() => almostEqual(1, 1, { absolute: Number.NaN })).toThrow(PrimitiveError);
    expectPrimitiveErrorCode(
      () => almostEqual(1, 1, { absolute: 0, relative: Number.POSITIVE_INFINITY }),
      "InvalidNumber"
    );
    expectPrimitiveErrorCode(
      () => almostEqual(1, 1, { absolute: 0, relative: -1 }),
      "InvalidTolerance"
    );
  });
});
