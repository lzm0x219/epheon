import { Angle, type Tolerance } from "@epheon/primitives";
import { Distance } from "./distance";

/** 坐标系统。 */
export const CoordinateSystem = {
  Ecliptic: "ECLIPTIC",
  Equatorial: "EQUATORIAL",
  Horizontal: "HORIZONTAL"
} as const;

/** 坐标系统的字符串字面量联合。 */
export type CoordinateSystem = (typeof CoordinateSystem)[keyof typeof CoordinateSystem];

/** 创建球面坐标时允许的最小输入。 */
export type SphericalCoordinatesInput =
  | {
      readonly longitude: Angle;
      readonly latitude: Angle;
      readonly distance?: Distance;
    }
  | {
      readonly longitudeDegrees: number;
      readonly latitudeDegrees: number;
      readonly distance?: Distance;
    };

/**
 * 球面坐标值对象。
 */
export class SphericalCoordinates {
  readonly #longitude: Angle;
  readonly #latitude: Angle;
  readonly #distance: Distance | undefined;

  private constructor(longitude: Angle, latitude: Angle, distance?: Distance) {
    this.#longitude = longitude;
    this.#latitude = latitude;
    this.#distance = distance;
  }

  /**
   * 从球面坐标输入创建值对象。
   *
   * @param input 球面坐标输入。
   * @returns 新的 SphericalCoordinates 值对象。
   */
  static from(input: SphericalCoordinatesInput): SphericalCoordinates {
    if ("longitude" in input) {
      return new SphericalCoordinates(input.longitude, input.latitude, input.distance);
    }

    return new SphericalCoordinates(
      Angle.fromDegrees(input.longitudeDegrees),
      Angle.fromDegrees(input.latitudeDegrees),
      input.distance
    );
  }

  /** 经度。 */
  get longitude(): Angle {
    return this.#longitude;
  }

  /** 纬度。 */
  get latitude(): Angle {
    return this.#latitude;
  }

  /** 可选距离。 */
  get distance(): Distance | undefined {
    return this.#distance;
  }

  /**
   * 使用严格数值相等比较球面坐标。
   *
   * @param other 要比较的另一个球面坐标。
   * @returns 三个分量都严格相等时返回 true。
   */
  equals(other: SphericalCoordinates): boolean {
    const sameDistance =
      this.#distance === undefined && other.#distance === undefined
        ? true
        : this.#distance !== undefined &&
          other.#distance !== undefined &&
          this.#distance.equals(other.#distance);

    return (
      this.#longitude.equals(other.#longitude) &&
      this.#latitude.equals(other.#latitude) &&
      sameDistance
    );
  }

  /**
   * 使用显式 tolerance 比较球面坐标。
   *
   * @param other 要比较的另一个球面坐标。
   * @param tolerance 误差容忍度。
   * @returns 坐标分量在 tolerance 范围内近似相等时返回 true。
   */
  almostEquals(other: SphericalCoordinates, tolerance: Tolerance): boolean {
    const sameDistance =
      this.#distance === undefined && other.#distance === undefined
        ? true
        : this.#distance !== undefined &&
          other.#distance !== undefined &&
          this.#distance.almostEquals(other.#distance, tolerance);

    return (
      this.#longitude.almostEquals(other.#longitude, tolerance) &&
      this.#latitude.almostEquals(other.#latitude, tolerance) &&
      sameDistance
    );
  }
}
