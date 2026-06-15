import { Duration, err, ok, type Result } from "@epheon/primitives";
import type { DeltaTProvider, LeapSecondProvider } from "./providers";
import { TemporalError, toTemporalError } from "./errors";
import { MINUTES_PER_DAY } from "./internal/constants";
import { gregorianToJulianDay } from "./internal/gregorian";
import { assertFiniteNumber } from "./internal/number";
import {
  taiMinusUtcToTTMinusUtc,
  ttMinusUtcToUT1MinusUtc,
  utcJulianDayToJulianEphemerisDay
} from "./internal/time-scale";
import { parseUTCDateTime } from "./internal/utc-parser";
import { JulianDay, JulianEphemerisDay } from "./julian-day";
import { UtcDateTime, type UtcDateTimeFields } from "./utc-date-time";

export type InstantOptions = {
  /** UTC 到 TAI 转换所需的闰秒 provider；请求 TT/JDE/UT1 时必须显式提供。 */
  readonly leapSeconds?: LeapSecondProvider;
  /** TT 到 UT1 转换所需的 Delta-T provider；只在请求 UT1 表达时使用。 */
  readonly deltaT?: DeltaTProvider;
};

/** 某个时间点在指定时间尺度下的表达。 */
export type TimePoint = {
  readonly scale: "TT" | "UT1";
  /** 该时间尺度相对 UTC 的偏移量。 */
  readonly offsetFromUtc: Duration;
};

/**
 * 不可变时间点值对象。
 *
 * 第一阶段以显式 offset 的 UTC 字符串作为输入边界，内部缓存 UTC Julian Day，
 * 并通过注入的 leap second provider 派生 TT/JDE。
 */
export class Instant {
  readonly #utcJulianDay: JulianDay;
  readonly #utcDateTime: UtcDateTime;
  readonly #taiMinusUtcSeconds: number | undefined;
  readonly #deltaT: DeltaTProvider | undefined;

  private constructor(
    utcJulianDay: JulianDay,
    utcDateTime: UtcDateTime,
    taiMinusUtcSeconds: number | undefined,
    deltaT: DeltaTProvider | undefined
  ) {
    this.#utcJulianDay = utcJulianDay;
    this.#utcDateTime = utcDateTime;
    this.#taiMinusUtcSeconds = taiMinusUtcSeconds;
    this.#deltaT = deltaT;
  }

  /**
   * 从显式 offset 的 UTC 字符串创建 Instant；失败时抛出 TemporalError。
   *
   * @param input 带 `Z` 或 `±HH:mm` offset 的 UTC-like 字符串。
   * @param options provider 注入选项。
   * @returns 解析成功后的 Instant 值对象。
   * @throws TemporalError 当 input 缺少 offset、日期非法或 provider 计算失败时抛出。
   */
  static fromUTC(input: string, options: InstantOptions = {}): Instant {
    const result = Instant.parseUTC(input, options);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 从显式 offset 的 UTC 字符串解析 Instant；失败时返回 Result 的错误分支。
   *
   * @param input 带 `Z` 或 `±HH:mm` offset 的 UTC-like 字符串。
   * @param options provider 注入选项。
   * @returns 成功时返回 Ok<Instant>，失败时返回 Err<TemporalError>。
   */
  static parseUTC(input: string, options: InstantOptions = {}): Result<Instant, TemporalError> {
    try {
      return ok(Instant.fromUTCDateTime(parseUTCDateTime(input), options));
    } catch (error) {
      return err(toTemporalError(error, "InvalidUTCDateTime"));
    }
  }

  /**
   * 从已校验的 UTC 输入边界值对象构造 Instant。
   *
   * @param utcDateTime 已通过 Gregorian 与 offset 校验的 UTC 输入边界值对象。
   * @param options provider 注入选项。
   * @returns 新的 Instant 值对象。
   * @throws TemporalError 当 provider 抛错或返回非法时间尺度数值时抛出。
   */
  private static fromUTCDateTime(utcDateTime: UtcDateTime, options: InstantOptions): Instant {
    const utcFields = utcDateTime.toFields();
    const localJulianDay = gregorianToJulianDay(utcFields);
    const utcJulianDay = JulianDay.fromNumber(
      localJulianDay - utcFields.offsetMinutes / MINUTES_PER_DAY
    );
    const taiMinusUtcSeconds = readOptionalLeapSeconds(utcDateTime, options);

    return new Instant(utcJulianDay, utcDateTime, taiMinusUtcSeconds, options.deltaT);
  }

  /**
   * 返回以 UTC 为时间尺度的 Julian Day。
   *
   * @returns 当前 Instant 对应的 UTC Julian Day。
   */
  toJulianDay(): JulianDay {
    return this.#utcJulianDay;
  }

  /**
   * 返回以 TT 为时间尺度的 Julian Ephemeris Day。
   *
   * @returns 当前 Instant 对应的 Julian Ephemeris Day。
   */
  toJulianEphemerisDay(): JulianEphemerisDay {
    return utcJulianDayToJulianEphemerisDay(this.#utcJulianDay, this.toTT().offsetFromUtc);
  }

  /**
   * 返回当前 Instant 在 TT 时间尺度下相对 UTC 的偏移表达。
   *
   * @returns scale 为 TT、offsetFromUtc 为 TT-UTC 的 TimePoint。
   */
  toTT(): TimePoint {
    return {
      scale: "TT",
      offsetFromUtc: taiMinusUtcToTTMinusUtc(this.requireTaiMinusUtcSeconds())
    };
  }

  /**
   * 返回当前 Instant 在 UT1 时间尺度下相对 UTC 的偏移表达。
   *
   * Delta-T 定义为 TT - UT1，因此 UT1-UTC 等于 TT-UTC 减去 Delta-T。
   *
   * @returns scale 为 UT1、offsetFromUtc 为 UT1-UTC 的 TimePoint。
   * @throws TemporalError 当构造 Instant 时未注入 deltaT provider，或 provider 计算失败时抛出。
   */
  toUT1(): TimePoint {
    if (this.#deltaT === undefined) {
      throw new TemporalError(
        "MissingDeltaTProvider",
        "deltaT provider is required to compute UT1."
      );
    }

    try {
      return {
        scale: "UT1",
        offsetFromUtc: ttMinusUtcToUT1MinusUtc(this.toTT().offsetFromUtc, this.#deltaT(this))
      };
    } catch (error) {
      throw toTemporalError(error, "InvalidTimeScaleInput");
    }
  }

  /**
   * 返回解析后的 UTC 输入边界值对象。
   *
   * @returns 当前 Instant 对应的 UtcDateTime 值对象。
   */
  toUTCDateTime(): UtcDateTime {
    return this.#utcDateTime;
  }

  /**
   * 返回解析后的 UTC 字段副本，避免调用方修改内部状态。
   *
   * @returns UTC 日期时间字段副本。
   */
  toUTCFields(): UtcDateTimeFields {
    return this.#utcDateTime.toFields();
  }

  /**
   * 返回已注入的 TAI-UTC 秒数。
   *
   * @returns TAI-UTC 秒数。
   * @throws TemporalError 当构造 Instant 时未注入 leap second provider 时抛出。
   */
  private requireTaiMinusUtcSeconds(): number {
    if (this.#taiMinusUtcSeconds === undefined) {
      throw new TemporalError(
        "MissingLeapSecondProvider",
        "leapSeconds provider is required to compute TT, JDE, or UT1."
      );
    }

    return this.#taiMinusUtcSeconds;
  }
}

/**
 * 读取并校验 leap second provider 的返回值。
 *
 * provider 是外部注入边界，返回 NaN/Infinity 或抛出异常时必须收敛成
 * temporal 包自己的结构化错误，避免泄漏下游实现细节。
 *
 * @param utcDateTime provider 接收的 UTC 输入边界值对象。
 * @param options Instant 构造选项。
 * @returns 已提供 provider 时返回有限的 TAI-UTC 秒数，否则返回 undefined。
 * @throws TemporalError 当 provider 抛错或返回非有限数时抛出。
 */
function readOptionalLeapSeconds(
  utcDateTime: UtcDateTime,
  options: InstantOptions
): number | undefined {
  if (options.leapSeconds === undefined) {
    return undefined;
  }

  try {
    const leapSeconds = options.leapSeconds(utcDateTime);
    assertFiniteNumber(leapSeconds, "leapSeconds", "InvalidTimeScaleInput");
    return leapSeconds;
  } catch (error) {
    throw toTemporalError(error, "InvalidTimeScaleInput");
  }
}
