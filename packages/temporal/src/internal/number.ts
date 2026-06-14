import { TemporalError, type TemporalErrorCode } from "../errors";

/**
 * 校验输入是有限 number，拒绝 NaN 与正负 Infinity。
 *
 * @param value 要校验的数值。
 * @param name 错误消息中使用的参数名称。
 * @param code 校验失败时使用的 temporal 错误码。
 * @returns 校验通过时不返回值。
 * @throws TemporalError 当 value 为 NaN 或 Infinity 时抛出。
 */
export function assertFiniteNumber(value: number, name: string, code: TemporalErrorCode): void {
  if (!Number.isFinite(value)) {
    throw new TemporalError(code, `${name} must be a finite number.`);
  }
}
