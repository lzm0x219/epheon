import { err, ok, type Result } from "@epheon/primitives";
import { TemporalError, toTemporalError } from "./errors";
import { assertFiniteNumber } from "./internal/number";

/** 不可变 Julian Day 值对象，表示连续日数。 */
export class JulianDay {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  /**
   * 从有限 number 创建 Julian Day。
   *
   * @param value Julian Day 数值。
   * @returns 新的 JulianDay 值对象。
   * @throws TemporalError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidJulianDay。
   */
  static fromNumber(value: number): JulianDay {
    const result = JulianDay.parseNumber(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 从有限 number 解析 Julian Day。
   *
   * @param value Julian Day 数值。
   * @returns 成功时返回 Ok<JulianDay>，失败时返回 Err<TemporalError>。
   */
  static parseNumber(value: number): Result<JulianDay, TemporalError> {
    try {
      assertFiniteNumber(value, "julianDay", "InvalidJulianDay");
      return ok(new JulianDay(value));
    } catch (error) {
      return err(toTemporalError(error, "InvalidJulianDay"));
    }
  }

  /**
   * 返回 Julian Day 的数值表达。
   *
   * @returns Julian Day number。
   */
  toNumber(): number {
    return this.#value;
  }
}

/** 不可变 Julian Ephemeris Day 值对象，表示以 TT 为时间尺度的连续日数。 */
export class JulianEphemerisDay {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  /**
   * 从有限 number 创建 Julian Ephemeris Day。
   *
   * @param value Julian Ephemeris Day 数值。
   * @returns 新的 JulianEphemerisDay 值对象。
   * @throws TemporalError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidJulianDay。
   */
  static fromNumber(value: number): JulianEphemerisDay {
    const result = JulianEphemerisDay.parseNumber(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 从有限 number 解析 Julian Ephemeris Day。
   *
   * @param value Julian Ephemeris Day 数值。
   * @returns 成功时返回 Ok<JulianEphemerisDay>，失败时返回 Err<TemporalError>。
   */
  static parseNumber(value: number): Result<JulianEphemerisDay, TemporalError> {
    try {
      assertFiniteNumber(value, "julianEphemerisDay", "InvalidJulianDay");
      return ok(new JulianEphemerisDay(value));
    } catch (error) {
      return err(toTemporalError(error, "InvalidJulianDay"));
    }
  }

  /**
   * 返回 Julian Ephemeris Day 的数值表达。
   *
   * @returns Julian Ephemeris Day number。
   */
  toNumber(): number {
    return this.#value;
  }
}
