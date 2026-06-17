import { Duration } from "@epheon/primitives";
import { expect } from "vitest";

/**
 * 使用显式时间 tolerance 断言两个时刻近似相等。
 *
 * @param actual 实际时刻对应的 UTC 毫秒时间戳。
 * @param expected 期望时刻对应的 UTC 毫秒时间戳。
 * @param tolerance 允许的时间误差。
 * @returns 断言通过时不返回值。
 */
export function expectInstantClose(actual: number, expected: number, tolerance: Duration): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance.toMilliseconds());
}

/**
 * 使用显式数值 tolerance 断言两个 number 近似相等。
 *
 * @param actual 实际数值。
 * @param expected 期望数值。
 * @param tolerance 允许的绝对误差。
 * @returns 断言通过时不返回值。
 */
export function expectNumberClose(actual: number, expected: number, tolerance: number): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}
