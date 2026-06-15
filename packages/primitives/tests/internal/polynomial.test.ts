import { describe, expect, it } from "vitest";
import { evaluatePolynomial } from "../../src/internal/polynomial";

describe("evaluatePolynomial", () => {
  it("evaluates a known polynomial: [1, 2, 3] at x=5 gives 86", () => {
    // f(x) = 1 + 2x + 3x², f(5) = 1 + 10 + 75 = 86
    expect(evaluatePolynomial([1, 2, 3], 5)).toBe(86);
  });

  it("evaluates a single coefficient as constant", () => {
    expect(evaluatePolynomial([42], 0)).toBe(42);
    expect(evaluatePolynomial([42], 100)).toBe(42);
    expect(evaluatePolynomial([-7], 3)).toBe(-7);
  });

  it("handles zero coefficients", () => {
    // f(x) = 0 + 0x + 0x² = 0
    expect(evaluatePolynomial([0], 5)).toBe(0);
    expect(evaluatePolynomial([0, 0, 0], 5)).toBe(0);
  });

  it("handles negative coefficients", () => {
    // f(x) = -3 + 2x - x², f(2) = -3 + 4 - 4 = -3
    expect(evaluatePolynomial([-3, 2, -1], 2)).toBe(-3);
    // f(x) = 0 - 5x, f(3) = -15
    expect(evaluatePolynomial([0, -5], 3)).toBe(-15);
  });

  it("returns 0 for empty coefficient array", () => {
    expect(evaluatePolynomial([], 100)).toBe(0);
  });

  it("evaluates at x=0 correctly", () => {
    // f(x) = c0 + c1*x + c2*x², f(0) = c0
    expect(evaluatePolynomial([7, 3, 2], 0)).toBe(7);
    expect(evaluatePolynomial([-5, 10, 100], 0)).toBe(-5);
  });

  it("evaluates at negative x correctly", () => {
    // f(x) = 1 + x + x², f(-2) = 1 - 2 + 4 = 3
    expect(evaluatePolynomial([1, 1, 1], -2)).toBe(3);
    // f(x) = 0 + 0x + x², f(-3) = 9
    expect(evaluatePolynomial([0, 0, 1], -3)).toBe(9);
  });

  it("handles large coefficient arrays", () => {
    // f(x) = 1 + x + x² + x³ + x⁴, f(2) = 1 + 2 + 4 + 8 + 16 = 31
    expect(evaluatePolynomial([1, 1, 1, 1, 1], 2)).toBe(31);
  });
});
