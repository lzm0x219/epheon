import { PrimitiveError, toPrimitiveError } from "./errors";
import { assertFiniteNumber, assertNonZeroFiniteNumber, normalizeModulo } from "./internal/number";
import { err, ok, type Result } from "./result";
import { almostEqual, type Tolerance } from "./tolerance";

const FULL_TURN_RADIANS = Math.PI * 2;
const DEGREES_PER_TURN = 360;
const ARCMINUTES_PER_DEGREE = 60;
const ARCSECONDS_PER_DEGREE = 3600;

/**
 * 不可变角度值对象。
 *
 * 内部统一使用弧度保存，构造时不会自动归一化，因此可以表达累计转角、
 * 角度差值等带有方向和圈数语义的值。
 */
export class Angle {
  readonly #radians: number;

  private constructor(radians: number) {
    this.#radians = radians;
  }

  /**
   * 使用弧度创建角度。
   *
   * @param value 弧度值，必须是有限 number。
   * @returns 新的 Angle 值对象。
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromRadians(value: number): Angle {
    const result = Angle.parseRadians(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用弧度解析角度。
   *
   * @param value 弧度值，必须是有限 number。
   * @returns 成功时返回 Ok<Angle>，失败时返回 Err<PrimitiveError>。
   */
  static parseRadians(value: number): Result<Angle, PrimitiveError> {
    try {
      assertFiniteNumber(value, "radians");
      return ok(new Angle(value));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用角度制创建角度。
   *
   * @param value 角度值，必须是有限 number。
   * @returns 新的 Angle 值对象。
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromDegrees(value: number): Angle {
    const result = Angle.parseDegrees(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用角度制解析角度。
   *
   * @param value 角度值，必须是有限 number。
   * @returns 成功时返回 Ok<Angle>，失败时返回 Err<PrimitiveError>。
   */
  static parseDegrees(value: number): Result<Angle, PrimitiveError> {
    try {
      assertFiniteNumber(value, "degrees");
      return ok(new Angle((value * Math.PI) / 180));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用整圈数创建角度，1 turn 等于 360 度。
   *
   * @param value 整圈数，必须是有限 number。
   * @returns 新的 Angle 值对象。
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromTurns(value: number): Angle {
    const result = Angle.parseTurns(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用整圈数解析角度。
   *
   * @param value 整圈数，必须是有限 number。
   * @returns 成功时返回 Ok<Angle>，失败时返回 Err<PrimitiveError>。
   */
  static parseTurns(value: number): Result<Angle, PrimitiveError> {
    try {
      assertFiniteNumber(value, "turns");
      return ok(new Angle(value * FULL_TURN_RADIANS));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用角分创建角度，60 角分等于 1 度。
   *
   * @param value 角分值，必须是有限 number。
   * @returns 新的 Angle 值对象。
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromArcminutes(value: number): Angle {
    const result = Angle.parseArcminutes(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用角分解析角度。
   *
   * @param value 角分值，必须是有限 number。
   * @returns 成功时返回 Ok<Angle>，失败时返回 Err<PrimitiveError>。
   */
  static parseArcminutes(value: number): Result<Angle, PrimitiveError> {
    try {
      assertFiniteNumber(value, "arcminutes");
      return ok(new Angle(((value / ARCMINUTES_PER_DEGREE) * Math.PI) / 180));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 使用角秒创建角度，3600 角秒等于 1 度。
   *
   * @param value 角秒值，必须是有限 number。
   * @returns 新的 Angle 值对象。
   * @throws TypeError 当 value 为 NaN 或 Infinity 时抛出。
   */
  static fromArcseconds(value: number): Angle {
    const result = Angle.parseArcseconds(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用角秒解析角度。
   *
   * @param value 角秒值，必须是有限 number。
   * @returns 成功时返回 Ok<Angle>，失败时返回 Err<PrimitiveError>。
   */
  static parseArcseconds(value: number): Result<Angle, PrimitiveError> {
    try {
      assertFiniteNumber(value, "arcseconds");
      return ok(new Angle(((value / ARCSECONDS_PER_DEGREE) * Math.PI) / 180));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /**
   * 返回弧度值。
   *
   * @returns 当前角度的弧度数值。
   */
  toRadians(): number {
    return this.#radians;
  }

  /**
   * 返回角度制数值。
   *
   * @returns 当前角度的度数。
   */
  toDegrees(): number {
    return (this.#radians * 180) / Math.PI;
  }

  /**
   * 返回整圈数，1 turn 等于 2π 弧度。
   *
   * @returns 当前角度对应的 turn 数值。
   */
  toTurns(): number {
    return this.#radians / FULL_TURN_RADIANS;
  }

  /**
   * 返回角分数值。
   *
   * @returns 当前角度对应的角分数。
   */
  toArcminutes(): number {
    return this.toDegrees() * ARCMINUTES_PER_DEGREE;
  }

  /**
   * 返回角秒数值。
   *
   * @returns 当前角度对应的角秒数。
   */
  toArcseconds(): number {
    return this.toDegrees() * ARCSECONDS_PER_DEGREE;
  }

  /**
   * 归一化到 [0, 2π) 弧度区间。
   *
   * @returns 归一化后的新 Angle 值对象。
   */
  normalizeRadians(): Angle {
    return Angle.fromRadians(normalizeModulo(this.#radians, FULL_TURN_RADIANS));
  }

  /**
   * 归一化到 [0, 360) 度区间。
   *
   * @returns 归一化后的新 Angle 值对象。
   */
  normalizeDegrees(): Angle {
    return Angle.fromDegrees(normalizeModulo(this.toDegrees(), DEGREES_PER_TURN));
  }

  /**
   * 归一化到 [0, 1) turn 区间。
   *
   * @returns 归一化后的新 Angle 值对象。
   */
  normalizeTurns(): Angle {
    return Angle.fromTurns(normalizeModulo(this.toTurns(), 1));
  }

  /**
   * 归一化到 [-180, 180) 度区间，适合表达最短方向差。
   *
   * @returns 归一化后的新 Angle 值对象。
   */
  normalizeSignedDegrees(): Angle {
    const degrees = normalizeModulo(this.toDegrees() + 180, DEGREES_PER_TURN) - 180;
    return Angle.fromDegrees(degrees);
  }

  /**
   * 返回两个角度相加后的新值。
   *
   * @param other 要相加的另一个角度。
   * @returns 相加后的新 Angle 值对象。
   */
  add(other: Angle): Angle {
    return Angle.fromRadians(this.#radians + other.#radians);
  }

  /**
   * 返回两个角度相减后的新值。
   *
   * @param other 要减去的另一个角度。
   * @returns 相减后的新 Angle 值对象。
   */
  subtract(other: Angle): Angle {
    return Angle.fromRadians(this.#radians - other.#radians);
  }

  /**
   * 返回按标量缩放后的新角度。
   *
   * @param factor 缩放因子，必须是有限 number。
   * @returns 缩放后的新 Angle 值对象。
   * @throws TypeError 当 factor 为 NaN 或 Infinity 时抛出。
   */
  multiply(factor: number): Angle {
    assertFiniteNumber(factor, "factor");
    return Angle.fromRadians(this.#radians * factor);
  }

  /**
   * 返回按非零标量相除后的新角度。
   *
   * @param divisor 除数，必须是有限且非零的 number。
   * @returns 相除后的新 Angle 值对象。
   * @throws TypeError 当 divisor 为 NaN 或 Infinity 时抛出。
   * @throws RangeError 当 divisor 为 0 时抛出。
   */
  divide(divisor: number): Angle {
    assertNonZeroFiniteNumber(divisor, "divisor");
    return Angle.fromRadians(this.#radians / divisor);
  }

  /**
   * 返回方向相反的角度。
   *
   * @returns 新的取反 Angle 值对象。
   */
  negate(): Angle {
    return Angle.fromRadians(-this.#radians);
  }

  /**
   * 返回弧度绝对值对应的角度。
   *
   * @returns 新的非负 Angle 值对象。
   */
  abs(): Angle {
    return Angle.fromRadians(Math.abs(this.#radians));
  }

  /**
   * 使用内部弧度值进行严格相等比较。
   *
   * @param other 要比较的另一个角度。
   * @returns 两个角度内部弧度值完全相等时返回 true。
   */
  equals(other: Angle): boolean {
    return this.#radians === other.#radians;
  }

  /**
   * 使用调用方显式传入的 tolerance 进行近似相等比较。
   *
   * @param other 要比较的另一个角度。
   * @param tolerance 以弧度为单位的误差容忍度。
   * @returns 两个角度在 tolerance 范围内近似相等时返回 true。
   * @throws TypeError 当 tolerance 中包含非有限数值时抛出。
   * @throws RangeError 当 tolerance 中包含负数时抛出。
   */
  almostEquals(other: Angle, tolerance: Tolerance): boolean {
    return almostEqual(this.#radians, other.#radians, tolerance);
  }
}
