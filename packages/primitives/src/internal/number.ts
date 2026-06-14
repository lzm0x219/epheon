import { PrimitiveError } from "../errors";

/**
 * 校验输入是有限 number，拒绝 NaN 与正负 Infinity。
 *
 * @param value 要校验的数值。
 * @param name 错误消息中使用的参数名称。
 * @returns 校验通过时不返回值。
 * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
 */
export function assertFiniteNumber(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new PrimitiveError("InvalidNumber", `${name} must be a finite number.`);
  }
}

/**
 * 校验输入是有限且非零的 number，适合除数等场景。
 *
 * @param value 要校验的数值。
 * @param name 错误消息中使用的参数名称。
 * @returns 校验通过时不返回值。
 * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
 * @throws RangeError 当 value 为 0 时抛出。
 */
export function assertNonZeroFiniteNumber(value: number, name: string): void {
  assertFiniteNumber(value, name);

  if (value === 0) {
    throw new PrimitiveError("DivisionByZero", `${name} must not be 0.`);
  }
}

/**
 * 按正周期归一化数值，返回区间为 [0, period)。
 *
 * @param value 要归一化的有限数值。
 * @param period 正周期长度。
 * @returns 归一化后的数值。
 * @throws TypeError 当 value 或 period 为 NaN 或 Infinity 时抛出。
 * @throws RangeError 当 period 小于等于 0 时抛出。
 */
export function normalizeModulo(value: number, period: number): number {
  assertFiniteNumber(value, "value");
  assertFiniteNumber(period, "period");

  if (period <= 0) {
    throw new PrimitiveError("InvalidNumber", "period must be greater than 0.");
  }

  return ((value % period) + period) % period;
}
