import { describe, expect, it } from "vitest";
import angleStandards from "../../../standards/primitives/angles.json";
import { Angle, PrimitiveError } from "../src";

const TOLERANCE = { absolute: 1e-12 };

describe("Angle", () => {
  it("converts between supported units from standards", () => {
    for (const standard of angleStandards.conversions) {
      expect(Angle.fromDegrees(standard.degrees).toRadians()).toBeCloseTo(standard.radians);
      expect(Angle.fromRadians(standard.radians).toDegrees()).toBeCloseTo(standard.degrees);
      expect(Angle.fromTurns(standard.turns).toDegrees()).toBeCloseTo(standard.degrees);
      expect(Angle.fromArcminutes(standard.arcminutes).toDegrees()).toBeCloseTo(standard.degrees);
      expect(Angle.fromArcseconds(standard.arcseconds).toDegrees()).toBeCloseTo(standard.degrees);
    }
  });

  it("normalizes unsigned and signed degree ranges from standards", () => {
    for (const standard of angleStandards.normalization) {
      const angle = Angle.fromDegrees(standard.degrees);

      expect(angle.normalizeDegrees().toDegrees()).toBeCloseTo(standard.normalizedDegrees);
      expect(angle.normalizeSignedDegrees().toDegrees()).toBeCloseTo(standard.signedDegrees);
    }
  });

  it("keeps values immutable during arithmetic", () => {
    const original = Angle.fromDegrees(10);
    const result = original.add(Angle.fromDegrees(20));

    expect(original.toDegrees()).toBe(10);
    expect(result.toDegrees()).toBeCloseTo(30);
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
});
