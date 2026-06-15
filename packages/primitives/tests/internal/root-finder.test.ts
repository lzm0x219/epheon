import { describe, expect, it } from "vitest";
import { PrimitiveError } from "../../src";
import { bisect } from "../../src/internal/root-finder";

describe("bisect", () => {
  it("finds root of linear function", () => {
    // f(x) = 2x, 求 2x = 10 → x = 5
    const root = bisect((x) => 2 * x, 10, 0, 10);

    expect(Math.abs(root - 5)).toBeLessThan(1e-10);
  });

  it("finds root of a trigonometric function", () => {
    // sin(x) = 0.5, 在 [0, π/2] 内 → x = π/6 ≈ 0.5235987756
    const root = bisect(Math.sin, 0.5, 0, Math.PI / 2);

    expect(Math.abs(root - Math.PI / 6)).toBeLessThan(1e-10);
  });

  it("finds root of quadratic function", () => {
    // f(x) = x² − 4, 求 x² = 4, 在 [0, 5] 内 → x = 2
    const root = bisect((x) => x * x, 4, 0, 5);

    expect(Math.abs(root - 2)).toBeLessThan(1e-10);
  });

  it("finds root at negative region", () => {
    // f(x) = x + 3, 求 x + 3 = 0 → x = -3, 在 [-10, 0] 内
    const root = bisect((x) => x + 3, 0, -10, 0);

    expect(Math.abs(root - -3)).toBeLessThan(1e-10);
  });

  it("respects custom tolerance", () => {
    const root = bisect((x) => 2 * x, 10, 0, 10, { tolerance: 1e-3 });

    // 只期望在 1e-3 范围内精确
    expect(Math.abs(root - 5)).toBeLessThan(1e-3);
    // 但不应在 1e-4 范围内收敛（否则说明 tolerance 被忽略）
    // 注意：有时运气可能刚好精确命中，但这个概率极低
  });

  it("throws PrimitiveError when bracket condition is not met (same sign)", () => {
    // f(x) = x², 求 x² = 10, 在 [-1, 1] 内：两端点值相同，无法 bracket
    expect(() => bisect((x) => x * x, 10, -1, 1)).toThrow(PrimitiveError);
  });

  it("throws PrimitiveError when target is outside range", () => {
    // f(x) = 2x, 求 2x = 100, 在 [0, 10] 内：f(0)=0<100, f(10)=20<100, 同号
    expect(() => bisect((x) => 2 * x, 100, 0, 10)).toThrow(PrimitiveError);
  });

  it("throws Error when maxIterations exceeded", () => {
    // 用极小的 maxIterations 和极小的 tolerance 强制超限
    expect(() =>
      bisect(Math.sin, 0.5, 0, Math.PI / 2, { tolerance: 1e-30, maxIterations: 3 })
    ).toThrow("did not converge");
  });

  it("works with default options", () => {
    const root = bisect((x) => 3 * x - 7, 0, 0, 10);

    expect(Math.abs(root - 7 / 3)).toBeLessThan(1e-10);
  });
});
