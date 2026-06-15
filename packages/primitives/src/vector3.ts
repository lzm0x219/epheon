import { PrimitiveError, toPrimitiveError } from "./errors";
import { assertFiniteNumber } from "./internal/number";
import { err, ok, type Result } from "./result";

/**
 * 不可变三维向量值对象。
 *
 * 用于天文计算中的空间位置、方向矢量与几何运算，不携带坐标参考系语义
 *（参考系由 @epheon/reference 包中的 ReferenceFrame 承载）。
 */
export class Vector3 {
  readonly #x: number;
  readonly #y: number;
  readonly #z: number;

  private constructor(x: number, y: number, z: number) {
    this.#x = x;
    this.#y = y;
    this.#z = z;
  }

  /**
   * 使用 x、y、z 分量创建三维向量。
   *
   * @param x X 分量，必须是有限 number。
   * @param y Y 分量，必须是有限 number。
   * @param z Z 分量，必须是有限 number。
   * @returns 新的 Vector3 值对象。
   * @throws PrimitiveError 当任一分量为 NaN 或 Infinity 时抛出，错误码为 InvalidNumber。
   */
  static fromXYZ(x: number, y: number, z: number): Vector3 {
    const result = Vector3.parseXYZ(x, y, z);

    if (!result.ok) {
      throw result.error;
    }

    return result.value;
  }

  /**
   * 使用 x、y、z 分量解析三维向量。
   *
   * @param x X 分量，必须是有限 number。
   * @param y Y 分量，必须是有限 number。
   * @param z Z 分量，必须是有限 number。
   * @returns 成功时返回 Ok<Vector3>，失败时返回 Err<PrimitiveError>。
   */
  static parseXYZ(x: number, y: number, z: number): Result<Vector3, PrimitiveError> {
    try {
      assertFiniteNumber(x, "x");
      assertFiniteNumber(y, "y");
      assertFiniteNumber(z, "z");
      return ok(new Vector3(x, y, z));
    } catch (error) {
      return err(toPrimitiveError(error, "InvalidNumber"));
    }
  }

  /** X 分量。 */
  get x(): number {
    return this.#x;
  }

  /** Y 分量。 */
  get y(): number {
    return this.#y;
  }

  /** Z 分量。 */
  get z(): number {
    return this.#z;
  }

  /**
   * 返回分量的元组表示。
   *
   * @returns [x, y, z] 三元组。
   */
  toArray(): [number, number, number] {
    return [this.#x, this.#y, this.#z];
  }

  /**
   * 返回两个向量相加后的新向量。
   *
   * @param other 要相加的另一个向量。
   * @returns 逐分量相加后的新 Vector3 值对象。
   */
  add(other: Vector3): Vector3 {
    return new Vector3(this.#x + other.#x, this.#y + other.#y, this.#z + other.#z);
  }

  /**
   * 返回两个向量相减后的新向量。
   *
   * @param other 要减去的另一个向量。
   * @returns 逐分量相减后的新 Vector3 值对象。
   */
  subtract(other: Vector3): Vector3 {
    return new Vector3(this.#x - other.#x, this.#y - other.#y, this.#z - other.#z);
  }

  /**
   * 返回两个向量的点积。
   *
   * @param other 另一个向量。
   * @returns 点积标量结果。
   */
  dot(other: Vector3): number {
    return this.#x * other.#x + this.#y * other.#y + this.#z * other.#z;
  }

  /**
   * 返回两个向量的叉积。
   *
   * 结果向量同时垂直于 a 和 b，方向由右手定则确定。
   *
   * @param other 另一个向量。
   * @returns 叉积结果的新 Vector3 值对象。
   */
  cross(other: Vector3): Vector3 {
    return new Vector3(
      this.#y * other.#z - this.#z * other.#y,
      this.#z * other.#x - this.#x * other.#z,
      this.#x * other.#y - this.#y * other.#x
    );
  }

  /**
   * 返回向量的欧几里得范数（模长）。
   *
   * @returns 模长标量。
   */
  magnitude(): number {
    return Math.sqrt(this.#x * this.#x + this.#y * this.#y + this.#z * this.#z);
  }

  /**
   * 返回归一化后的单位向量。
   *
   * @returns 与原向量同方向的单位向量。
   * @throws PrimitiveError 当向量为零向量时抛出，错误码为 DivisionByZero。
   */
  normalize(): Vector3 {
    const m = this.magnitude();

    if (m === 0) {
      throw new PrimitiveError("DivisionByZero", "Cannot normalize a zero vector.");
    }

    return new Vector3(this.#x / m, this.#y / m, this.#z / m);
  }

  /**
   * 使用逐分量严格相等比较。
   *
   * @param other 要比较的另一个向量。
   * @returns 三个分量都严格相等时返回 true。
   */
  equals(other: Vector3): boolean {
    return this.#x === other.#x && this.#y === other.#y && this.#z === other.#z;
  }
}
