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
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromNumber(value: number): JulianDay {
    assertFiniteNumber(value, "julianDay");
    return new JulianDay(value);
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
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromNumber(value: number): JulianEphemerisDay {
    assertFiniteNumber(value, "julianEphemerisDay");
    return new JulianEphemerisDay(value);
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
