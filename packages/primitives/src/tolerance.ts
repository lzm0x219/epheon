import { PrimitiveError } from "./errors";
import { assertFiniteNumber } from "./internal/number";

/** 数值近似比较的误差容忍度，调用方必须显式给出。 */
export type Tolerance = {
  /** 绝对误差上限。 */
  readonly absolute: number;
  /** 相对误差上限；未提供时只使用绝对误差。 */
  readonly relative?: number;
};

/**
 * 校验 tolerance 本身是否为可用于比较的非负有限数。
 *
 * @param tolerance 要校验的误差容忍度。
 * @returns 校验通过时不返回值。
 * @throws TypeError 当 tolerance 中包含非有限数值时抛出。
 * @throws RangeError 当 tolerance 中包含负数时抛出。
 */
export function assertValidTolerance(tolerance: Tolerance): void {
  assertFiniteNumber(tolerance.absolute, "tolerance.absolute");

  if (tolerance.absolute < 0) {
    throw new PrimitiveError(
      "InvalidTolerance",
      "tolerance.absolute must be greater than or equal to 0."
    );
  }

  if (tolerance.relative !== undefined) {
    assertFiniteNumber(tolerance.relative, "tolerance.relative");

    if (tolerance.relative < 0) {
      throw new PrimitiveError(
        "InvalidTolerance",
        "tolerance.relative must be greater than or equal to 0."
      );
    }
  }
}

/**
 * 使用显式 absolute/relative tolerance 判断两个数是否近似相等。
 *
 * @param a 第一个有限数值。
 * @param b 第二个有限数值。
 * @param tolerance 误差容忍度。
 * @returns 两个数在 tolerance 范围内近似相等时返回 true。
 * @throws TypeError 当 a、b 或 tolerance 中包含非有限数值时抛出。
 * @throws RangeError 当 tolerance 中包含负数时抛出。
 */
export function almostEqual(a: number, b: number, tolerance: Tolerance): boolean {
  assertFiniteNumber(a, "a");
  assertFiniteNumber(b, "b");
  assertValidTolerance(tolerance);

  const difference = Math.abs(a - b);

  if (difference <= tolerance.absolute) {
    return true;
  }

  if (tolerance.relative === undefined) {
    return false;
  }

  return difference <= Math.max(Math.abs(a), Math.abs(b)) * tolerance.relative;
}
