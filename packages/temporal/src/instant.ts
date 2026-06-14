import { Duration, err, ok, type Result } from "@epheon/primitives";
import type { UtcDateTimeFields } from "./internal/utc-fields";
import type { LeapSecondProvider } from "./providers";
import { TemporalError, toTemporalError } from "./errors";
import { MINUTES_PER_DAY, SECONDS_PER_DAY, TT_MINUS_TAI_SECONDS } from "./internal/constants";
import { gregorianToJulianDay } from "./internal/gregorian";
import { parseUTCDateTime } from "./internal/utc-parser";
import { JulianDay, JulianEphemerisDay } from "./julian-day";

export type InstantOptions = {
  /** UTC 到 TAI 转换所需的闰秒 provider；未提供时第一阶段按 0 处理。 */
  readonly leapSeconds?: LeapSecondProvider;
};

/** 某个时间点在指定时间尺度下的表达。 */
export type TimePoint = {
  readonly scale: "TT";
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
  readonly #utcFields: UtcDateTimeFields;
  readonly #leapSeconds: number;

  private constructor(utcJulianDay: JulianDay, utcFields: UtcDateTimeFields, leapSeconds: number) {
    this.#utcJulianDay = utcJulianDay;
    this.#utcFields = utcFields;
    this.#leapSeconds = leapSeconds;
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
      return ok(Instant.fromUTCFields(parseUTCDateTime(input), options));
    } catch (error) {
      return err(toTemporalError(error, "InvalidUTCDateTime"));
    }
  }

  /**
   * 从已校验的 UTC 字段构造 Instant，避免 public API 绕过解析边界。
   *
   * @param utcFields 已通过 Gregorian 与 offset 校验的 UTC 字段。
   * @param options provider 注入选项。
   * @returns 新的 Instant 值对象。
   */
  private static fromUTCFields(utcFields: UtcDateTimeFields, options: InstantOptions): Instant {
    const localJulianDay = gregorianToJulianDay(utcFields);
    const utcJulianDay = JulianDay.fromNumber(
      localJulianDay - utcFields.offsetMinutes / MINUTES_PER_DAY
    );
    const leapSeconds = options.leapSeconds?.(utcFields) ?? 0;

    return new Instant(utcJulianDay, utcFields, leapSeconds);
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
    const ttOffsetSeconds = this.#leapSeconds + TT_MINUS_TAI_SECONDS;

    return JulianEphemerisDay.fromNumber(
      this.#utcJulianDay.toNumber() + ttOffsetSeconds / SECONDS_PER_DAY
    );
  }

  /**
   * 返回当前 Instant 在 TT 时间尺度下相对 UTC 的偏移表达。
   *
   * @returns scale 为 TT、offsetFromUtc 为 TT-UTC 的 TimePoint。
   */
  toTT(): TimePoint {
    return {
      scale: "TT",
      offsetFromUtc: Duration.fromSeconds(this.#leapSeconds + TT_MINUS_TAI_SECONDS)
    };
  }

  /**
   * 返回解析后的 UTC 字段副本，避免调用方修改内部状态。
   *
   * @returns UTC 日期时间字段副本。
   */
  toUTCFields(): UtcDateTimeFields {
    return { ...this.#utcFields };
  }
}
