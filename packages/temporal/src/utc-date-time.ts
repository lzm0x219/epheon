import { TemporalError, toTemporalError } from "./errors";
import { assertGregorianDateTime } from "./internal/gregorian";

/**
 * 带显式 UTC offset 的日期时间字段。
 *
 * 该类型表示输入边界保留下来的 civil date-time 与 offset，不负责表达 IANA
 * time zone，也不隐式读取系统本地时区。
 */
export type UtcDateTimeFields = {
  /** Gregorian 整数年份，允许扩展年份。 */
  readonly year: number;
  /** Gregorian 整数月份，范围为 1-12。 */
  readonly month: number;
  /** Gregorian 整数日期，范围取决于 year 与 month。 */
  readonly day: number;
  /** 整数小时，范围为 0-23。 */
  readonly hour: number;
  /** 整数分钟，范围为 0-59。 */
  readonly minute: number;
  /** 秒，范围为 [0, 60)，第一阶段不接受闰秒输入边界。 */
  readonly second: number;
  /** 输入中声明的 UTC offset 整数分钟数，东区为正，西区为负。 */
  readonly offsetMinutes: number;
};

/**
 * 不可变 UTC 输入边界值对象。
 *
 * 它保存显式 offset 日期时间字段，并作为 provider 与 `Instant` 输出 UTC
 * 边界信息的稳定公共模型；内部解析器和 Gregorian 算法不得把私有字段类型泄漏给调用方。
 */
export class UtcDateTime {
  readonly #fields: UtcDateTimeFields;

  private constructor(fields: UtcDateTimeFields) {
    this.#fields = fields;
  }

  /**
   * 从日期时间字段创建 UTC 输入边界值对象。
   *
   * @param fields 带显式 UTC offset 的日期时间字段。
   * @returns 校验通过后的 UtcDateTime 值对象。
   * @throws TemporalError 当字段不是有限数、日期时间离散字段不是整数、
   * offset 非整数或 Gregorian 日期时间非法时抛出。
   */
  static fromFields(fields: UtcDateTimeFields): UtcDateTime {
    try {
      assertFiniteFields(fields);
      assertGregorianDateTime(fields);
      return new UtcDateTime({ ...fields });
    } catch (error) {
      throw toTemporalError(error, "InvalidUTCDateTime");
    }
  }

  /**
   * 返回 Gregorian 年份。
   *
   * @returns 当前 UTC 输入边界的年份。
   */
  get year(): number {
    return this.#fields.year;
  }

  /**
   * 返回 Gregorian 月份。
   *
   * @returns 当前 UTC 输入边界的月份。
   */
  get month(): number {
    return this.#fields.month;
  }

  /**
   * 返回 Gregorian 日期。
   *
   * @returns 当前 UTC 输入边界的日期。
   */
  get day(): number {
    return this.#fields.day;
  }

  /**
   * 返回小时。
   *
   * @returns 当前 UTC 输入边界的小时。
   */
  get hour(): number {
    return this.#fields.hour;
  }

  /**
   * 返回分钟。
   *
   * @returns 当前 UTC 输入边界的分钟。
   */
  get minute(): number {
    return this.#fields.minute;
  }

  /**
   * 返回秒。
   *
   * @returns 当前 UTC 输入边界的秒。
   */
  get second(): number {
    return this.#fields.second;
  }

  /**
   * 返回输入声明的 UTC offset 分钟数。
   *
   * @returns 东区为正、西区为负的 offset 分钟数。
   */
  get offsetMinutes(): number {
    return this.#fields.offsetMinutes;
  }

  /**
   * 返回字段副本，避免调用方修改内部状态。
   *
   * @returns 当前 UTC 输入边界字段副本。
   */
  toFields(): UtcDateTimeFields {
    return { ...this.#fields };
  }
}

/**
 * 校验所有 UTC 日期时间字段都是有限数，并约束离散日期时间字段为整数。
 *
 * @param fields 要校验的 UTC 日期时间字段。
 * @returns 校验通过时不返回值。
 * @throws TemporalError 当字段不是有限数，或年月日时分及 offset 不是整数时抛出。
 */
function assertFiniteFields(fields: UtcDateTimeFields): void {
  for (const [name, value] of Object.entries(fields)) {
    if (!Number.isFinite(value)) {
      throw new TemporalError("InvalidUTCDateTime", `${name} must be a finite number.`);
    }
  }

  for (const name of ["year", "month", "day", "hour", "minute", "offsetMinutes"] as const) {
    if (!Number.isInteger(fields[name])) {
      throw new TemporalError("InvalidUTCDateTime", `${name} must be an integer.`);
    }
  }

  if (Math.abs(fields.offsetMinutes) > 23 * 60 + 59) {
    throw new TemporalError("InvalidUTCDateTime", "offsetMinutes is out of range.");
  }
}
