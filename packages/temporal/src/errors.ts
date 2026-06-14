/** temporal 包内可识别的结构化错误码。 */
export type TemporalErrorCode =
  | "InvalidJulianDay"
  | "InvalidTimeScaleInput"
  | "InvalidUTCDateTime"
  | "MissingDeltaTProvider";

/**
 * 时间模型的结构化错误。
 *
 * `fromXxx` 这类便捷构造 API 会抛出该错误；`parseXxx` API 则把它放入
 * Result 的失败分支中返回。
 */
export class TemporalError extends Error {
  /** 稳定错误码，供调用方分支处理。 */
  readonly code: TemporalErrorCode;

  /**
   * 创建 temporal 结构化错误。
   *
   * @param code 稳定错误码。
   * @param message 面向开发者的错误说明。
   * @param options 原始错误 cause 等 ErrorOptions。
   */
  constructor(code: TemporalErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TemporalError";
    this.code = code;
  }
}

/**
 * 将未知异常收敛为 TemporalError，避免向公共 API 泄漏内部错误类型。
 *
 * @param error 捕获到的未知异常。
 * @param code 需要映射成的 temporal 错误码。
 * @returns 结构化 TemporalError。
 */
export function toTemporalError(error: unknown, code: TemporalErrorCode): TemporalError {
  if (error instanceof TemporalError) {
    return error;
  }

  if (error instanceof Error) {
    return new TemporalError(code, error.message, { cause: error });
  }

  return new TemporalError(code, "Unknown temporal error.", { cause: error });
}
