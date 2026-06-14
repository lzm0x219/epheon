import { describe, expect, it } from "vitest";
import { Angle } from "../src";

const TOLERANCE = { absolute: 1e-12 };

describe("Angle", () => {
  it("converts between supported units", () => {
    expect(Angle.fromDegrees(180).toRadians()).toBeCloseTo(Math.PI);
    expect(Angle.fromTurns(0.5).toDegrees()).toBeCloseTo(180);
    expect(Angle.fromArcminutes(60).toDegrees()).toBeCloseTo(1);
    expect(Angle.fromArcseconds(3600).toDegrees()).toBeCloseTo(1);
  });

  it("normalizes unsigned and signed degree ranges", () => {
    expect(Angle.fromDegrees(370).normalizeDegrees().toDegrees()).toBeCloseTo(10);
    expect(Angle.fromDegrees(-10).normalizeDegrees().toDegrees()).toBeCloseTo(350);
    expect(Angle.fromDegrees(190).normalizeSignedDegrees().toDegrees()).toBeCloseTo(-170);
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

  it("rejects non-finite values", () => {
    expect(() => Angle.fromDegrees(Number.NaN)).toThrow(TypeError);
    expect(() => Angle.fromRadians(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});
