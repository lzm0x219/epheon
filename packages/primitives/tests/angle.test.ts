import { describe, expect, it } from "vitest";
import angleStandards from "../../../standards/primitives/angles.json";
import { Angle, PrimitiveError } from "../src";
import { expectAlmostEqual, expectPrimitiveErrorCode } from "./helpers";

const TOLERANCE = { absolute: 1e-12 };

describe("Angle", () => {
  it("converts between supported units from standards", () => {
    for (const standard of angleStandards.conversions) {
      expectAlmostEqual(
        Angle.fromDegrees(standard.degrees).toRadians(),
        standard.radians,
        TOLERANCE
      );
      expectAlmostEqual(
        Angle.fromRadians(standard.radians).toDegrees(),
        standard.degrees,
        TOLERANCE
      );
      expectAlmostEqual(Angle.fromTurns(standard.turns).toDegrees(), standard.degrees, TOLERANCE);
      expectAlmostEqual(
        Angle.fromArcminutes(standard.arcminutes).toDegrees(),
        standard.degrees,
        TOLERANCE
      );
      expectAlmostEqual(
        Angle.fromArcseconds(standard.arcseconds).toDegrees(),
        standard.degrees,
        TOLERANCE
      );
    }
  });

  it("normalizes unsigned and signed degree ranges from standards", () => {
    for (const standard of angleStandards.normalization) {
      const angle = Angle.fromDegrees(standard.degrees);

      expectAlmostEqual(
        angle.normalizeDegrees().toDegrees(),
        standard.normalizedDegrees,
        TOLERANCE
      );
      expectAlmostEqual(
        angle.normalizeSignedDegrees().toDegrees(),
        standard.signedDegrees,
        TOLERANCE
      );
    }
  });

  it("normalizes radians and turns to half-open ranges", () => {
    const fromRadians = Angle.fromRadians(-Math.PI / 2).normalizeRadians();
    const fromTurns = Angle.fromTurns(1.25).normalizeTurns();

    expect(fromRadians.toRadians()).toBeGreaterThanOrEqual(0);
    expect(fromRadians.toRadians()).toBeLessThan(Math.PI * 2);
    expectAlmostEqual(fromRadians.toDegrees(), 270, TOLERANCE);
    expect(fromTurns.toTurns()).toBeGreaterThanOrEqual(0);
    expect(fromTurns.toTurns()).toBeLessThan(1);
    expectAlmostEqual(fromTurns.toTurns(), 0.25, TOLERANCE);
  });

  it("keeps values immutable during arithmetic", () => {
    const original = Angle.fromDegrees(10);
    const result = original.add(Angle.fromDegrees(20));

    expect(original.toDegrees()).toBe(10);
    expectAlmostEqual(result.toDegrees(), 30, TOLERANCE);
  });

  it("handles arithmetic boundary methods", () => {
    const angle = Angle.fromDegrees(-30);

    expectAlmostEqual(angle.subtract(Angle.fromDegrees(15)).toDegrees(), -45, TOLERANCE);
    expectAlmostEqual(angle.multiply(2).toDegrees(), -60, TOLERANCE);
    expectAlmostEqual(angle.divide(2).toDegrees(), -15, TOLERANCE);
    expectAlmostEqual(angle.negate().toDegrees(), 30, TOLERANCE);
    expectAlmostEqual(angle.abs().toDegrees(), 30, TOLERANCE);
    expect(angle.equals(Angle.fromDegrees(-30))).toBe(true);
    expect(angle.equals(Angle.fromDegrees(30))).toBe(false);
  });

  it("requires explicit tolerance for approximate equality", () => {
    const a = Angle.fromDegrees(90);
    const b = Angle.fromRadians(Math.PI / 2);

    expect(a.almostEquals(b, TOLERANCE)).toBe(true);
  });

  it("returns structured parse errors for non-finite values", () => {
    const result = Angle.parseDegrees(Number.NaN);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBeInstanceOf(PrimitiveError);
      expect(result.error.code).toBe("InvalidNumber");
    }
  });

  it("throws PrimitiveError from throwing constructors", () => {
    expect(() => Angle.fromDegrees(Number.NaN)).toThrow(PrimitiveError);
    expect(() => Angle.fromRadians(Number.POSITIVE_INFINITY)).toThrow(PrimitiveError);
    expect(() => Angle.fromDegrees(1).divide(0)).toThrow(PrimitiveError);
  });

  it("reports stable error codes for invalid arithmetic inputs", () => {
    expectPrimitiveErrorCode(() => Angle.fromDegrees(1).multiply(Number.NaN), "InvalidNumber");
    expectPrimitiveErrorCode(() => Angle.fromDegrees(1).divide(0), "DivisionByZero");
  });
});
