import { PrimitiveError, err, ok, type Result } from "@epheon/primitives";
import { almostEqual, type Tolerance } from "@epheon/primitives";

/**
 * 以 AU 表示的不可变距离值对象。
 */
export class Distance {
  readonly #au: number;

  private constructor(au: number) {
    this.#au = au;
  }

  /**
   * 使用 AU 创建距离。
   *
   * @param value AU 数值。
   * @returns 新的 Distance 值对象。
   * @throws PrimitiveError 当 value 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromAU(value: number): Distance {
    const result = Distance.parseAU(value);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用 AU 解析距离。
   *
   * @param value AU 数值。
   * @returns 成功时返回 Ok<Distance>，失败时返回 Err<PrimitiveError>。
   */
  static parseAU(value: number): Result<Distance, PrimitiveError> {
    if (!Number.isFinite(value)) {
      return err(new PrimitiveError("InvalidNumber", "au must be a finite number."));
    }

    return ok(new Distance(value));
  }

  /**
   * 返回 AU 数值。
   *
   * @returns 当前距离的 AU 数值。
   */
  toAU(): number {
    return this.#au;
  }

  /**
   * 将距离乘以有限数值。
   *
   * @param factor 乘数。
   * @returns 相乘后的新 Distance 值对象。
   * @throws PrimitiveError 当 factor 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  multiply(factor: number): Distance {
    if (!Number.isFinite(factor)) {
      throw new PrimitiveError("InvalidNumber", "factor must be a finite number.");
    }

    return Distance.fromAU(this.#au * factor);
  }

  /**
   * 将距离除以非零有限数值。
   *
   * @param divisor 除数。
   * @returns 相除后的新 Distance 值对象。
   * @throws PrimitiveError 当 divisor 为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   * @throws PrimitiveError 当 divisor 为 0 时抛出，错误码为 DivisionByZero。
   */
  divide(divisor: number): Distance {
    if (!Number.isFinite(divisor)) {
      throw new PrimitiveError("InvalidNumber", "divisor must be a finite number.");
    }

    if (divisor === 0) {
      throw new PrimitiveError("DivisionByZero", "divisor must not be 0.");
    }

    return Distance.fromAU(this.#au / divisor);
  }

  /**
   * 使用严格数值相等比较距离。
   *
   * @param other 要比较的另一个距离。
   * @returns 两个 AU 数值严格相等时返回 true。
   */
  equals(other: Distance): boolean {
    return this.#au === other.#au;
  }

  /**
   * 使用显式 tolerance 比较两个距离是否近似相等。
   *
   * @param other 要比较的另一个距离。
   * @param tolerance 误差容忍度。
   * @returns 两个距离在 tolerance 范围内近似相等时返回 true。
   */
  almostEquals(other: Distance, tolerance: Tolerance): boolean {
    return almostEqual(this.#au, other.#au, tolerance);
  }
}
