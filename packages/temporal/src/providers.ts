import type { Duration } from "@epheon/primitives";
import type { Instant } from "./instant";
import type { UtcDateTimeFields } from "./internal/utc-fields";

/** UTC 输入字段的 provider 视图，后续可替换为更稳定的公共输入类型。 */
export type UtcInstantLike = UtcDateTimeFields;

/**
 * 返回指定 UTC 输入对应的 TAI - UTC 秒数。
 *
 * @param input UTC 日期时间字段。
 * @returns TAI - UTC 秒数。
 */
export type LeapSecondProvider = (input: UtcInstantLike) => number;

/**
 * 返回指定 Instant 对应的 Delta-T，即 TT - UT1。
 *
 * @param instant 要估算 Delta-T 的时间点。
 * @returns Delta-T 时长。
 */
export type DeltaTProvider = (instant: Instant) => Duration;

/**
 * 创建固定闰秒 provider，主要用于测试和早期无数据场景。
 *
 * @param taiMinusUtc 固定的 TAI - UTC 秒数。
 * @returns 总是返回 taiMinusUtc 的 LeapSecondProvider。
 */
export function fixedLeapSeconds(taiMinusUtc: number): LeapSecondProvider {
  return () => taiMinusUtc;
}

/**
 * 创建固定 Delta-T provider，主要用于测试和早期无数据场景。
 *
 * @param deltaT 固定的 Delta-T 时长。
 * @returns 总是返回 deltaT 的 DeltaTProvider。
 */
export function fixedDeltaT(deltaT: Duration): DeltaTProvider {
  return () => deltaT;
}
