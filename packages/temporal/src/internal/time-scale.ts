import { Duration } from "@epheon/primitives";
import { JulianDay, JulianEphemerisDay } from "../julian-day";
import { TT_MINUS_TAI_SECONDS, SECONDS_PER_DAY } from "./constants";
import { assertFiniteNumber } from "./number";

/**
 * 将 TAI-UTC 秒数转换为 TT-UTC 时长。
 *
 * TT = TAI + 32.184 秒，因此 TT-UTC = TAI-UTC + 32.184 秒。
 *
 * @param taiMinusUtcSeconds TAI-UTC 秒数，必须是有限 number。
 * @returns TT-UTC 时长。
 * @throws TemporalError 当 taiMinusUtcSeconds 为 NaN 或 Infinity 时抛出，错误码为 InvalidTimeScaleInput。
 */
export function taiMinusUtcToTTMinusUtc(taiMinusUtcSeconds: number): Duration {
  assertFiniteNumber(taiMinusUtcSeconds, "taiMinusUtcSeconds", "InvalidTimeScaleInput");
  return Duration.fromSeconds(taiMinusUtcSeconds + TT_MINUS_TAI_SECONDS);
}

/**
 * 将 UTC Julian Day 与 TT-UTC offset 转换为 Julian Ephemeris Day。
 *
 * JDE 使用 TT 时间尺度，因此在 UTC JD 上增加 TT-UTC 对应的日数。
 *
 * @param utcJulianDay UTC 时间尺度下的 Julian Day。
 * @param ttMinusUtc TT-UTC 时长。
 * @returns TT 时间尺度下的 Julian Ephemeris Day。
 * @throws TemporalError 当换算后的 Julian Ephemeris Day 为 NaN 或 Infinity 时抛出，错误码为 InvalidJulianDay。
 */
export function utcJulianDayToJulianEphemerisDay(
  utcJulianDay: JulianDay,
  ttMinusUtc: Duration
): JulianEphemerisDay {
  return JulianEphemerisDay.fromNumber(
    utcJulianDay.toNumber() + ttMinusUtc.toSeconds() / SECONDS_PER_DAY
  );
}

/**
 * 将 TT-UTC 与 Delta-T 转换为 UT1-UTC。
 *
 * Delta-T 定义为 TT - UT1，因此 UT1-UTC = TT-UTC - Delta-T。
 *
 * @param ttMinusUtc TT-UTC 时长。
 * @param deltaT Delta-T，即 TT-UT1。
 * @returns UT1-UTC 时长。
 * @throws PrimitiveError 当相减结果为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
 */
export function ttMinusUtcToUT1MinusUtc(ttMinusUtc: Duration, deltaT: Duration): Duration {
  return ttMinusUtc.subtract(deltaT);
}
