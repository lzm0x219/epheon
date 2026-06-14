import { describe, expect, it } from "vitest";
import { err, isErr, isOk, ok } from "../src";

describe("Result", () => {
  it("represents success and failure", () => {
    const success = ok(42);
    const failure = err("invalid");

    expect(isOk(success)).toBe(true);
    expect(isErr(success)).toBe(false);
    expect(isErr(failure)).toBe(true);
    expect(isOk(failure)).toBe(false);
  });
});
