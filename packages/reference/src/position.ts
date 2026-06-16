import type { Tolerance } from "@epheon/primitives";
import { type SphericalCoordinates } from "./coordinate";
import { type Origin } from "./origin";
import { type ReferenceFrame } from "./reference-frame";

/** 创建位置值对象时允许的最小输入。 */
export type PositionInput = {
  readonly coordinates: SphericalCoordinates;
  readonly frame: ReferenceFrame;
  readonly origin: Origin;
};

/**
 * 完整位置表达。
 */
export class Position {
  readonly #coordinates: SphericalCoordinates;
  readonly #frame: ReferenceFrame;
  readonly #origin: Origin;

  private constructor(coordinates: SphericalCoordinates, frame: ReferenceFrame, origin: Origin) {
    this.#coordinates = coordinates;
    this.#frame = frame;
    this.#origin = origin;
  }

  /**
   * 从位置输入创建值对象。
   *
   * @param input 位置输入。
   * @returns 新的 Position 值对象。
   */
  static from(input: PositionInput): Position {
    return new Position(input.coordinates, input.frame, input.origin);
  }

  /** 球面坐标。 */
  get coordinates(): SphericalCoordinates {
    return this.#coordinates;
  }

  /** 参考系。 */
  get frame(): ReferenceFrame {
    return this.#frame;
  }

  /** 坐标原点。 */
  get origin(): Origin {
    return this.#origin;
  }

  /**
   * 使用严格数值相等比较位置。
   *
   * @param other 要比较的另一个位置。
   * @returns 坐标、参考系和原点都相等时返回 true。
   */
  equals(other: Position): boolean {
    return (
      this.#coordinates.equals(other.#coordinates) &&
      this.#frame.equals(other.#frame) &&
      this.#origin === other.#origin
    );
  }

  /**
   * 使用显式 tolerance 比较位置。
   *
   * @param other 要比较的另一个位置。
   * @param tolerance 误差容忍度。
   * @returns 坐标在 tolerance 范围内近似相等且参考系、原点严格相等时返回 true。
   */
  almostEquals(other: Position, tolerance: Tolerance): boolean {
    return (
      this.#coordinates.almostEquals(other.#coordinates, tolerance) &&
      this.#frame.equals(other.#frame) &&
      this.#origin === other.#origin
    );
  }
}
