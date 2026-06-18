import { solarEclipticState } from "@4n6h4x0r/stem-branch";
import {
  EphemerisError,
  Precision,
  resolveEphemerisOptions,
  toEphemerisError,
  type EphemerisOptions,
  type EphemerisProvider
} from "@epheon/ephemerides";
import { Angle } from "@epheon/primitives";
import {
  Body,
  Distance,
  Origin,
  Position,
  ReferenceFrame,
  SphericalCoordinates
} from "@epheon/reference";
import { Instant, JulianEphemerisDay } from "@epheon/temporal";

/** 太阳位置 helper 支持的最小输入。 */
export type SolarPositionInput = Instant | JulianEphemerisDay;

type SolarSolution = {
  readonly trueLongitudeDegrees: number;
  readonly apparentLongitudeDegrees: number;
  readonly radiusAu: number;
};

/**
 * 创建太阳 provider。
 *
 * 当前 provider 只支持 `Body.Sun`，并返回地心黄道坐标。
 *
 * @returns 遵循 `EphemerisProvider` 协议的太阳 provider。
 */
export function createVSOP87SunProvider(): EphemerisProvider {
  return {
    position(body, instant, options) {
      if (body !== Body.Sun) {
        throw new EphemerisError("UnsupportedBody", `Unsupported body: ${body}.`);
      }

      return solarEclipticPosition(instant, options);
    }
  };
}

/**
 * 计算太阳地心黄经。
 *
 * @param input JDE 或已可换算到 JDE 的 Instant。
 * @param options 参考系与精度要求。
 * @returns 指定参考系下的太阳黄经。
 */
export function solarEclipticLongitude(
  input: SolarPositionInput,
  options?: EphemerisOptions
): Angle {
  return solarEclipticPosition(input, options).coordinates.longitude;
}

/**
 * 计算太阳地心黄道位置。
 *
 * @param input JDE 或已可换算到 JDE 的 Instant。
 * @param options 参考系与精度要求。
 * @returns 指定参考系下的太阳位置。
 * @throws {EphemerisError} 当 frame、precision 或输入不受支持时抛出。
 */
export function solarEclipticPosition(
  input: SolarPositionInput,
  options?: EphemerisOptions
): Position {
  const resolved = resolveSupportedOptions(options);

  try {
    const solution = solveSolarPosition(resolveJulianEphemerisDay(input).toNumber());
    const longitudeDegrees = resolved.frame.equals(ReferenceFrame.TrueOfDateEcliptic)
      ? solution.apparentLongitudeDegrees
      : solution.trueLongitudeDegrees;

    return Position.from({
      coordinates: SphericalCoordinates.from({
        longitudeDegrees,
        latitudeDegrees: 0,
        distance: Distance.fromAU(solution.radiusAu)
      }),
      frame: resolved.frame,
      origin: Origin.Geocentric
    });
  } catch (error) {
    throw toEphemerisError(error, "InvalidInput");
  }
}

/**
 * 校验当前实现支持的 frame 与 precision。
 *
 * @param options 调用方提供的星历要求。
 * @returns 已补齐默认值且确认受支持的 options。
 * @throws {EphemerisError} 当 frame 或 precision 不受支持时抛出。
 */
function resolveSupportedOptions(options?: EphemerisOptions): Required<EphemerisOptions> {
  const resolved = resolveEphemerisOptions(options);

  if (
    !resolved.frame.equals(ReferenceFrame.MeanOfDateEcliptic) &&
    !resolved.frame.equals(ReferenceFrame.TrueOfDateEcliptic)
  ) {
    throw new EphemerisError("InvalidFrame", `Unsupported frame: ${resolved.frame.name}.`);
  }

  if (resolved.precision !== Precision.Standard) {
    throw new EphemerisError(
      "UnsupportedPrecision",
      `Unsupported precision: ${resolved.precision}.`
    );
  }

  return resolved;
}

/**
 * 统一把输入换算成 JDE。
 *
 * @param input JDE 或可推导 JDE 的 Instant。
 * @returns JDE 值对象。
 */
function resolveJulianEphemerisDay(input: SolarPositionInput): JulianEphemerisDay {
  if (input instanceof JulianEphemerisDay) {
    return input;
  }

  return input.toJulianEphemerisDay();
}

/**
 * 计算太阳地心黄经与日地距离。
 *
 * 复用 stem-branch 的 VSOP87D 解算（含 JPL DE441 拟合校正）：输入为 TT 时间尺度下的 JDE，
 * 返回地心黄道经度（平春分点 / 视黄经）与日地距离。相对 JPL DE441，节气定时平均 1.05s、
 * 最大 3.05s（209–2493 CE，1,008 个节气）。
 *
 * @param julianEphemerisDay TT 时间尺度下的 JDE。
 * @returns 当前时刻的太阳黄经与距离解。
 */
function solveSolarPosition(julianEphemerisDay: number): SolarSolution {
  return solarEclipticState(julianEphemerisDay);
}
