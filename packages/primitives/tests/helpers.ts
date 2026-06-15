import { expect } from "vitest";
import { almostEqual, type Tolerance } from "../src";

/**
 * 使用显式 tolerance 断言两个数值近似相等。
 *
 * @param actual 实际数值。
 * @param expected 期望数值。
 * @param tolerance 误差容忍度。
 * @returns 断言通过时不返回值。
 */
export function expectAlmostEqual(actual: number, expected: number, tolerance: Tolerance): void {
  expect(almostEqual(actual, expected, tolerance)).toBe(true);
}
