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
 * 创建最小太阳 provider。
 *
 * 当前 provider 只支持 `Body.Sun`，并返回地心黄道坐标。
 *
 * @returns 遵循 `EphemerisProvider` 协议的最小太阳 provider。
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
 * 校验当前最小实现支持的 frame 与 precision。
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
 * 计算最小太阳模型。
 *
 * 该模型输出地心黄经和日地距离，足够覆盖当前 bootstrap fixture。
 *
 * @param julianEphemerisDay TT 时间尺度下的 JDE。
 * @returns 当前时刻的太阳黄经与距离解。
 */
function solveSolarPosition(julianEphemerisDay: number): SolarSolution {
  const centuriesSinceJ2000 = (julianEphemerisDay - 2451545) / 36525;

  const meanLongitudeDegrees = normalizeDegrees(
    280.46646 +
      36000.76983 * centuriesSinceJ2000 +
      0.0003032 * centuriesSinceJ2000 * centuriesSinceJ2000
  );
  const meanAnomalyDegrees = normalizeDegrees(
    357.52911 +
      35999.05029 * centuriesSinceJ2000 -
      0.0001537 * centuriesSinceJ2000 * centuriesSinceJ2000
  );
  const eccentricity =
    0.016708634 -
    0.000042037 * centuriesSinceJ2000 -
    0.0000001267 * centuriesSinceJ2000 * centuriesSinceJ2000;
  const meanAnomalyRadians = toRadians(meanAnomalyDegrees);
  const equationOfCenterDegrees =
    (1.914602 -
      0.004817 * centuriesSinceJ2000 -
      0.000014 * centuriesSinceJ2000 * centuriesSinceJ2000) *
      Math.sin(meanAnomalyRadians) +
    (0.019993 - 0.000101 * centuriesSinceJ2000) * Math.sin(2 * meanAnomalyRadians) +
    0.000289 * Math.sin(3 * meanAnomalyRadians);
  const trueLongitudeDegrees = normalizeDegrees(meanLongitudeDegrees + equationOfCenterDegrees);
  const trueAnomalyDegrees = normalizeDegrees(meanAnomalyDegrees + equationOfCenterDegrees);
  const omegaRadians = toRadians(125.04 - 1934.136 * centuriesSinceJ2000);

  // ponytail: bootstrap with a low-order solar model; replace with full VSOP87 terms when
  // multi-century accuracy or non-solar bodies become part of the public contract.
  return {
    trueLongitudeDegrees,
    apparentLongitudeDegrees: normalizeDegrees(
      trueLongitudeDegrees - 0.00569 - 0.00478 * Math.sin(omegaRadians)
    ),
    radiusAu:
      (1.000001018 * (1 - eccentricity * eccentricity)) /
      (1 + eccentricity * Math.cos(toRadians(trueAnomalyDegrees)))
  };
}

/**
 * 归一化角度到 [0, 360)。
 *
 * @param degrees 任意度数。
 * @returns 归一化后的度数。
 */
function normalizeDegrees(degrees: number): number {
  const normalized = degrees % 360;

  return normalized < 0 ? normalized + 360 : normalized;
}

/**
 * 将度数换算成弧度。
 *
 * @param degrees 度数值。
 * @returns 对应弧度值。
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
