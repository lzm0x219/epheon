import { describe, expect, it } from "vitest";
import vectorStandards from "../../../standards/primitives/vectors.json";
import { PrimitiveError, Vector3 } from "../src";
import { expectPrimitiveErrorCode } from "./helpers";

const TOLERANCE = 1e-12;

function expectVecAlmostEqual(
  actual: Vector3,
  expected: { x: number; y: number; z: number }
): void {
  expect(Math.abs(actual.x - expected.x)).toBeLessThan(TOLERANCE);
  expect(Math.abs(actual.y - expected.y)).toBeLessThan(TOLERANCE);
  expect(Math.abs(actual.z - expected.z)).toBeLessThan(TOLERANCE);
}

describe("Vector3", () => {
  it("computes magnitude for known vectors from standards", () => {
    for (const v of vectorStandards.vectors) {
      const vec = Vector3.fromXYZ(v.x, v.y, v.z);
      expect(Math.abs(vec.magnitude() - v.magnitude)).toBeLessThan(TOLERANCE);
    }
  });

  it("computes add, subtract, dot, cross from standards", () => {
    for (const op of vectorStandards.operations) {
      const a = Vector3.fromXYZ(op.a.x, op.a.y, op.a.z);
      const b = Vector3.fromXYZ(op.b.x, op.b.y, op.b.z);

      expectVecAlmostEqual(a.add(b), op.add);
      expectVecAlmostEqual(a.subtract(b), op.subtract);
      expect(Math.abs(a.dot(b) - op.dot)).toBeLessThan(TOLERANCE);
      expectVecAlmostEqual(a.cross(b), op.cross);
    }
  });

  it("provides component getters and toArray", () => {
    const v = Vector3.fromXYZ(1, 2, 3);

    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
    expect(v.toArray()).toEqual([1, 2, 3]);
  });

  it("keeps values immutable during arithmetic", () => {
    const a = Vector3.fromXYZ(1, 0, 0);
    const b = Vector3.fromXYZ(0, 1, 0);
    const result = a.add(b);

    expect(a.toArray()).toEqual([1, 0, 0]);
    expect(b.toArray()).toEqual([0, 1, 0]);
    expect(result.toArray()).toEqual([1, 1, 0]);
  });

  it("normalizes to unit vectors", () => {
    const v = Vector3.fromXYZ(3, 4, 0);
    const unit = v.normalize();

    expect(Math.abs(unit.magnitude() - 1)).toBeLessThan(TOLERANCE);
    expect(Math.abs(unit.x - 0.6)).toBeLessThan(TOLERANCE);
    expect(Math.abs(unit.y - 0.8)).toBeLessThan(TOLERANCE);
    expect(unit.z).toBe(0);
  });

  it("throws DivisionByZero when normalizing zero vector", () => {
    const zero = Vector3.fromXYZ(0, 0, 0);
    expectPrimitiveErrorCode(() => zero.normalize(), "DivisionByZero");
  });

  it("rejects NaN or Infinity in any component", () => {
    expectPrimitiveErrorCode(() => Vector3.fromXYZ(Number.NaN, 0, 0), "InvalidNumber");
    expectPrimitiveErrorCode(
      () => Vector3.fromXYZ(0, Number.POSITIVE_INFINITY, 0),
      "InvalidNumber"
    );
    expectPrimitiveErrorCode(
      () => Vector3.fromXYZ(0, 0, Number.NEGATIVE_INFINITY),
      "InvalidNumber"
    );
  });

  it("returns structured parse errors for non-finite components", () => {
    const result = Vector3.parseXYZ(Number.NaN, 1, 2);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(PrimitiveError);
      expect(result.error.code).toBe("InvalidNumber");
    }
  });

  it("computes cross product with known right-angle results", () => {
    const x = Vector3.fromXYZ(1, 0, 0);
    const y = Vector3.fromXYZ(0, 1, 0);
    const z = Vector3.fromXYZ(0, 0, 1);

    expect(x.cross(y).toArray()).toEqual([0, 0, 1]);
    expect(y.cross(z).toArray()).toEqual([1, 0, 0]);
    expect(z.cross(x).toArray()).toEqual([0, 1, 0]);
  });

  it("parallel vectors cross to zero", () => {
    const a = Vector3.fromXYZ(2, 0, 0);
    const b = Vector3.fromXYZ(5, 0, 0);
    const result = a.cross(b);

    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.z).toBe(0);
  });

  it("checks strict equality", () => {
    const a = Vector3.fromXYZ(1, 2, 3);
    const b = Vector3.fromXYZ(1, 2, 3);
    const c = Vector3.fromXYZ(1, 2, 4);

    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });
});
