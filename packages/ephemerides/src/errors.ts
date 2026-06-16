/** ephemerides 包内可识别的结构化错误码。 */
export type EphemerisErrorCode =
  | "UnsupportedBody"
  | "InvalidFrame"
  | "UnsupportedPrecision"
  | "PositionUnavailable"
  | "InvalidInput";

/**
 * 星历 provider 边界的结构化错误。
 *
 * `position()` 失败时应抛出该错误，而不是返回空结果。
 */
export class EphemerisError extends Error {
  /** 稳定错误码，供调用方分支处理。 */
  readonly code: EphemerisErrorCode;

  /**
   * 创建 ephemerides 结构化错误。
   *
   * @param code 稳定错误码。
   * @param message 面向开发者的错误说明。
   * @param options 原始错误 cause 等 ErrorOptions。
   */
  constructor(code: EphemerisErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "EphemerisError";
    this.code = code;
  }
}

/**
 * 将未知异常收敛为 EphemerisError，避免向公共 API 泄漏内部错误类型。
 *
 * @param error 捕获到的未知异常。
 * @param code 需要映射成的 ephemerides 错误码。
 * @returns 结构化 EphemerisError。
 */
export function toEphemerisError(error: unknown, code: EphemerisErrorCode): EphemerisError {
  if (error instanceof EphemerisError) {
    return error;
  }

  if (error instanceof Error) {
    return new EphemerisError(code, error.message, { cause: error });
  }

  return new EphemerisError(code, "Unknown ephemeris error.", { cause: error });
}
