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
    throw new TypeError(`${name} must be a finite number.`);
  }
}
