import { JulianEphemerisDay } from "@epheon/temporal";
import { CoordinateSystem } from "./coordinate";

/**
 * 坐标参考系值对象。
 */
export class ReferenceFrame {
  static readonly ICRS: ReferenceFrame = new ReferenceFrame(
    "ICRS",
    CoordinateSystem.Equatorial,
    JulianEphemerisDay.fromNumber(2451545)
  );
  static readonly MeanOfDateEcliptic: ReferenceFrame = new ReferenceFrame(
    "MeanOfDateEcliptic",
    CoordinateSystem.Ecliptic
  );
  static readonly TrueOfDateEcliptic: ReferenceFrame = new ReferenceFrame(
    "TrueOfDateEcliptic",
    CoordinateSystem.Ecliptic
  );

  readonly #name: string;
  readonly #coordinateSystem: CoordinateSystem;
  readonly #epoch: JulianEphemerisDay | undefined;

  private constructor(
    name: string,
    coordinateSystem: CoordinateSystem,
    epoch?: JulianEphemerisDay
  ) {
    this.#name = name;
    this.#coordinateSystem = coordinateSystem;
    this.#epoch = epoch;
  }

  /** 稳定参考系名称。 */
  get name(): string {
    return this.#name;
  }

  /** 该参考系对应的坐标系统。 */
  get coordinateSystem(): CoordinateSystem {
    return this.#coordinateSystem;
  }

  /** 该参考系的固定历元；瞬时历元帧返回 undefined。 */
  get epoch(): JulianEphemerisDay | undefined {
    return this.#epoch;
  }

  /**
   * 比较参考系是否严格相等。
   *
   * @param other 要比较的另一个参考系。
   * @returns 名称、坐标系统和历元都相等时返回 true。
   */
  equals(other: ReferenceFrame): boolean {
    return (
      this.#name === other.#name &&
      this.#coordinateSystem === other.#coordinateSystem &&
      this.#epoch?.toNumber() === other.#epoch?.toNumber()
    );
  }
}
