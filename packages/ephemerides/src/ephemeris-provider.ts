import type { Body, Position } from "@epheon/reference";
import type { Instant } from "@epheon/temporal";
import { ReferenceFrame } from "@epheon/reference";
import { Precision, type Precision as PrecisionValue } from "./precision";

/**
 * 调用方对星历结果的最小要求。
 */
export type EphemerisOptions = {
  /** 目标参考系；省略时默认使用 `MeanOfDateEcliptic`。 */
  readonly frame?: ReferenceFrame;
  /** 目标精度等级；省略时默认使用 `Precision.Standard`。 */
  readonly precision?: PrecisionValue;
};

/**
 * 补齐默认参考系与默认精度，供 provider 实现统一复用。
 *
 * @param options 调用方提供的可选星历要求。
 * @returns 已填充默认值的稳定 options 对象。
 */
export function resolveEphemerisOptions(
  options: EphemerisOptions = {}
): Required<EphemerisOptions> {
  return {
    frame: options.frame ?? ReferenceFrame.MeanOfDateEcliptic,
    precision: options.precision ?? Precision.Standard
  };
}

/**
 * 星历 provider 的最小统一协议。
 */
export interface EphemerisProvider {
  /**
   * 计算指定天体在某一时刻的位置。
   *
   * @param body 目标天体。
   * @param instant 观测时刻。
   * @param options 结果参考系与精度要求；省略时使用默认值。
   * @returns 指定参考系下的位置值对象。
   * @throws {EphemerisError} 当天体、参考系、精度或数据覆盖不支持时抛出。
   */
  position(body: Body, instant: Instant, options?: EphemerisOptions): Position;
}
