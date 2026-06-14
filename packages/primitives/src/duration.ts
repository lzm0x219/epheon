import { PrimitiveError, toPrimitiveError } from "./errors";
import { assertFiniteNumber, assertNonZeroFiniteNumber } from "./internal/number";
import { err, ok, type Result } from "./result";
import { almostEqual, type Tolerance } from "./tolerance";

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 86400;
const DAYS_PER_JULIAN_YEAR = 365.25;
const DAYS_PER_JULIAN_CENTURY = 36525;

/**
 * 不可变时长值对象。
 *
 * 内部统一使用秒保存，只表达固定长度的物理时间间隔，不表达日历月、
 * 民用年份、夏令时等非固定长度概念。
 */
export class Duration {
  readonly #seconds: number;

  private constructor(seconds: number) {
    this.#seconds = seconds;
  }

  /**
   * 使用秒创建时长。
   *
   * @param value 秒数，必须是有限 number。
   * @returns 新的 Duration 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromSeconds(value: number): Duration {
    const result = Duration.parseSeconds(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用秒解析时长。
   *
   * @param value 秒数，必须是有限 number。
   * @returns 成功时返回 Ok<Duration>，失败时返回 Err<PrimitiveError>。
   */
  static parseSeconds(value: number): Result<Duration, PrimitiveError> {
    try {
      assertFiniteNumber(value, "seconds");
      return ok(new Duration(value));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用毫秒创建时长。
   *
   * @param value 毫秒数，必须是有限 number。
   * @returns 新的 Duration 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromMilliseconds(value: number): Duration {
    const result = Duration.parseMilliseconds(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用毫秒解析时长。
   *
   * @param value 毫秒数，必须是有限 number。
   * @returns 成功时返回 Ok<Duration>，失败时返回 Err<PrimitiveError>。
   */
  static parseMilliseconds(value: number): Result<Duration, PrimitiveError> {
    try {
      assertFiniteNumber(value, "milliseconds");
      return ok(new Duration(value / MILLISECONDS_PER_SECOND));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用固定 86400 秒的日创建时长。
   *
   * @param value 日数，必须是有限 number。
   * @returns 新的 Duration 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromDays(value: number): Duration {
    const result = Duration.parseDays(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用固定 86400 秒的日解析时长。
   *
   * @param value 日数，必须是有限 number。
   * @returns 成功时返回 Ok<Duration>，失败时返回 Err<PrimitiveError>。
   */
  static parseDays(value: number): Result<Duration, PrimitiveError> {
    try {
      assertFiniteNumber(value, "days");
      return ok(new Duration(value * SECONDS_PER_DAY));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用儒略年创建时长，1 儒略年固定为 365.25 日。
   *
   * @param value 儒略年数，必须是有限 number。
   * @returns 新的 Duration 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromJulianYears(value: number): Duration {
    const result = Duration.parseJulianYears(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用儒略年解析时长，1 儒略年固定为 365.25 日。
   *
   * @param value 儒略年数，必须是有限 number。
   * @returns 成功时返回 Ok<Duration>，失败时返回 Err<PrimitiveError>。
   */
  static parseJulianYears(value: number): Result<Duration, PrimitiveError> {
    try {
      assertFiniteNumber(value, "julianYears");
      return ok(new Duration(value * DAYS_PER_JULIAN_YEAR * SECONDS_PER_DAY));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用儒略世纪创建时长，1 儒略世纪固定为 36525 日。
   *
   * @param value 儒略世纪数，必须是有限 number。
   * @returns 新的 Duration 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromJulianCenturies(value: number): Duration {
    const result = Duration.parseJulianCenturies(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用儒略世纪解析时长，1 儒略世纪固定为 36525 日。
   *
   * @param value 儒略世纪数，必须是有限 number。
   * @returns 成功时返回 Ok<Duration>，失败时返回 Err<PrimitiveError>。
   */
  static parseJulianCenturies(value: number): Result<Duration, PrimitiveError> {
    try {
      assertFiniteNumber(value, "julianCenturies");
      return ok(new Duration(value * DAYS_PER_JULIAN_CENTURY * SECONDS_PER_DAY));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 返回秒数。
   *
   * @returns 当前时长对应的秒数。
   */
  toSeconds(): number {
    return this.#seconds;
  }

  /**
   * 返回毫秒数。
   *
   * @returns 当前时长对应的毫秒数。
   */
  toMilliseconds(): number {
    return this.#seconds * MILLISECONDS_PER_SECOND;
  }

  /**
   * 返回以固定 86400 秒为一日的日数。
   *
   * @returns 当前时长对应的固定日数。
   */
  toDays(): number {
    return this.#seconds / SECONDS_PER_DAY;
  }

  /**
   * 返回儒略年数。
   *
   * @returns 当前时长对应的儒略年数。
   */
  toJulianYears(): number {
    return this.toDays() / DAYS_PER_JULIAN_YEAR;
  }

  /**
   * 返回儒略世纪数。
   *
   * @returns 当前时长对应的儒略世纪数。
   */
  toJulianCenturies(): number {
    return this.toDays() / DAYS_PER_JULIAN_CENTURY;
  }

  /**
   * 返回两个时长相加后的新值。
   *
   * @param other 要相加的另一个时长。
   * @returns 相加后的新 Duration 值对象。
   */
  add(other: Duration): Duration {
    return Duration.fromSeconds(this.#seconds + other.#seconds);
  }

  /**
   * 返回两个时长相减后的新值。
   *
   * @param other 要减去的另一个时长。
   * @returns 相减后的新 Duration 值对象。
   */
  subtract(other: Duration): Duration {
    return Duration.fromSeconds(this.#seconds - other.#seconds);
  }

  /**
   * 返回按标量缩放后的新时长。
   *
   * @param factor 缩放因子，必须是有限 number。
   * @returns 缩放后的新 Duration 值对象。
   * @throws PrimitiveError 当 factor 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  multiply(factor: number): Duration {
    assertFiniteNumber(factor, "factor");
    return Duration.fromSeconds(this.#seconds * factor);
  }

  /**
   * 返回按非零标量相除后的新时长。
   *
   * @param divisor 除数，必须是有限且非零的 number。
   * @returns 相除后的新 Duration 值对象。
   * @throws PrimitiveError 当 divisor 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   * @throws PrimitiveError 当 divisor 为 0 时抛出，错误码为 DivisionByZero。
   */
  divide(divisor: number): Duration {
    assertNonZeroFiniteNumber(divisor, "divisor");
    return Duration.fromSeconds(this.#seconds / divisor);
  }

  /**
   * 返回符号相反的时长。
   *
   * @returns 新的取反 Duration 值对象。
   */
  negate(): Duration {
    return Duration.fromSeconds(-this.#seconds);
  }

  /**
   * 返回秒数绝对值对应的时长。
   *
   * @returns 新的非负 Duration 值对象。
   */
  abs(): Duration {
    return Duration.fromSeconds(Math.abs(this.#seconds));
  }

  /**
   * 使用内部秒数进行严格相等比较。
   *
   * @param other 要比较的另一个时长。
   * @returns 两个时长内部秒数完全相等时返回 true。
   */
  equals(other: Duration): boolean {
    return this.#seconds === other.#seconds;
  }

  /**
   * 使用调用方显式传入的 tolerance 进行近似相等比较。
   *
   * @param other 要比较的另一个时长。
   * @param tolerance 以秒为单位的误差容忍度。
   * @returns 两个时长在 tolerance 范围内近似相等时返回 true。
   * @throws PrimitiveError 当 tolerance 中包含非有限数值时抛出，错误码为 InvalidNumber。
   * @throws PrimitiveError 当 tolerance 中包含负数时抛出，错误码为 InvalidTolerance。
   */
  almostEquals(other: Duration, tolerance: Tolerance): boolean {
    return almostEqual(this.#seconds, other.#seconds, tolerance);
  }
}
