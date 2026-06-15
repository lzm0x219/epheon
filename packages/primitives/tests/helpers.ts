import { expect } from "vitest";
import { almostEqual, PrimitiveError, type PrimitiveErrorCode, type Tolerance } from "../src";

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

/**
 * 断言回调抛出指定 primitives 错误码。
 *
 * @param action 预期会抛出 PrimitiveError 的回调。
 * @param code 期望的稳定错误码。
 * @returns 断言通过时不返回值。
 */
export function expectPrimitiveErrorCode(action: () => unknown, code: PrimitiveErrorCode): void {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(PrimitiveError);
    expect((error as PrimitiveError).code).toBe(code);
    return;
  }

  throw new Error(`Expected PrimitiveError with code ${code}.`);
}
