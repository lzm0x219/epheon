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

const ASTRONOMICAL_UNIT_KILOMETERS = 149_597_870.7;

/** 月亮位置 helper 支持的最小输入。 */
export type MoonPositionInput = Instant | JulianEphemerisDay;

type MoonSolution = {
  readonly eclipticLongitudeDegrees: number;
  readonly apparentLongitudeDegrees: number;
  readonly latitudeDegrees: number;
  readonly distanceAu: number;
};

/**
 * 创建最小月亮 provider。
 *
 * 当前 provider 只支持 `Body.Moon`，并返回地心黄道坐标。
 *
 * @returns 遵循 `EphemerisProvider` 协议的最小月亮 provider。
 */
export function createELP2000MoonProvider(): EphemerisProvider {
  return {
    position(body, instant, options) {
      if (body !== Body.Moon) {
        throw new EphemerisError("UnsupportedBody", `Unsupported body: ${body}.`);
      }

      return lunarEclipticPosition(instant, options);
    }
  };
}

/**
 * 计算月亮地心黄经。
 *
 * @param input JDE 或已可换算到 JDE 的 Instant。
 * @param options 参考系与精度要求。
 * @returns 指定参考系下的月亮黄经。
 */
export function lunarEclipticLongitude(
  input: MoonPositionInput,
  options?: EphemerisOptions
): Angle {
  return lunarEclipticPosition(input, options).coordinates.longitude;
}

/**
 * 计算月亮地心黄道位置。
 *
 * @param input JDE 或已可推导 JDE 的 Instant。
 * @param options 参考系与精度要求。
 * @returns 指定参考系下的月亮位置。
 * @throws {EphemerisError} 当 frame、precision 或输入不受支持时抛出。
 */
export function lunarEclipticPosition(
  input: MoonPositionInput,
  options?: EphemerisOptions
): Position {
  const resolved = resolveSupportedOptions(options);

  try {
    const solution = solveMoonPosition(resolveJulianEphemerisDay(input).toNumber());
    const longitudeDegrees = resolved.frame.equals(ReferenceFrame.TrueOfDateEcliptic)
      ? solution.apparentLongitudeDegrees
      : solution.eclipticLongitudeDegrees;

    return Position.from({
      coordinates: SphericalCoordinates.from({
        longitudeDegrees,
        latitudeDegrees: solution.latitudeDegrees,
        distance: Distance.fromAU(solution.distanceAu)
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
function resolveJulianEphemerisDay(input: MoonPositionInput): JulianEphemerisDay {
  if (input instanceof JulianEphemerisDay) {
    return input;
  }

  return input.toJulianEphemerisDay();
}

/**
 * 计算最小月亮模型。
 *
 * 当前采用低阶周期项，目标是提供朔望求解所需的稳定月亮黄经输入。
 *
 * @param julianEphemerisDay TT 时间尺度下的 JDE。
 * @returns 当前时刻的月亮黄经、纬度与距离解。
 */
function solveMoonPosition(julianEphemerisDay: number): MoonSolution {
  const centuriesSinceJ2000 = (julianEphemerisDay - 2451545) / 36525;
  const meanLongitudeDegrees = normalizeDegrees(
    218.3164477 +
      481267.88123421 * centuriesSinceJ2000 -
      0.0015786 * centuriesSinceJ2000 * centuriesSinceJ2000 +
      (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 538841 -
      centuriesSinceJ2000 ** 4 / 65_194_000
  );
  const meanElongationDegrees = normalizeDegrees(
    297.8501921 +
      445267.1114034 * centuriesSinceJ2000 -
      0.0018819 * centuriesSinceJ2000 * centuriesSinceJ2000 +
      (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 545868 -
      centuriesSinceJ2000 ** 4 / 113_065_000
  );
  const solarMeanAnomalyDegrees = normalizeDegrees(
    357.5291092 +
      35999.0502909 * centuriesSinceJ2000 -
      0.0001536 * centuriesSinceJ2000 * centuriesSinceJ2000 +
      (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 24_490_000
  );
  const lunarMeanAnomalyDegrees = normalizeDegrees(
    134.9633964 +
      477198.8675055 * centuriesSinceJ2000 +
      0.0087414 * centuriesSinceJ2000 * centuriesSinceJ2000 +
      (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 69699 -
      centuriesSinceJ2000 ** 4 / 14_712_000
  );
  const argumentOfLatitudeDegrees = normalizeDegrees(
    93.272095 +
      483202.0175233 * centuriesSinceJ2000 -
      0.0036539 * centuriesSinceJ2000 * centuriesSinceJ2000 -
      (centuriesSinceJ2000 * centuriesSinceJ2000 * centuriesSinceJ2000) / 3_526_000 +
      centuriesSinceJ2000 ** 4 / 863_310_000
  );

  const meanElongationRadians = toRadians(meanElongationDegrees);
  const solarMeanAnomalyRadians = toRadians(solarMeanAnomalyDegrees);
  const lunarMeanAnomalyRadians = toRadians(lunarMeanAnomalyDegrees);
  const argumentOfLatitudeRadians = toRadians(argumentOfLatitudeDegrees);

  const eclipticLongitudeDegrees = normalizeDegrees(
    meanLongitudeDegrees +
      6.289 * Math.sin(lunarMeanAnomalyRadians) +
      1.274 * Math.sin(2 * meanElongationRadians - lunarMeanAnomalyRadians) +
      0.658 * Math.sin(2 * meanElongationRadians) +
      0.214 * Math.sin(2 * lunarMeanAnomalyRadians) -
      0.186 * Math.sin(solarMeanAnomalyRadians) -
      0.059 * Math.sin(2 * meanElongationRadians - 2 * lunarMeanAnomalyRadians) -
      0.057 *
        Math.sin(2 * meanElongationRadians - solarMeanAnomalyRadians - lunarMeanAnomalyRadians) +
      0.053 * Math.sin(2 * meanElongationRadians + lunarMeanAnomalyRadians) +
      0.046 * Math.sin(2 * meanElongationRadians - solarMeanAnomalyRadians) +
      0.041 * Math.sin(solarMeanAnomalyRadians - lunarMeanAnomalyRadians) -
      0.035 * Math.sin(meanElongationRadians) -
      0.031 * Math.sin(solarMeanAnomalyRadians + lunarMeanAnomalyRadians) -
      0.015 * Math.sin(2 * argumentOfLatitudeRadians - 2 * meanElongationRadians) +
      0.011 * Math.sin(2 * meanElongationRadians - 4 * lunarMeanAnomalyRadians)
  );

  const latitudeDegrees =
    5.128 * Math.sin(argumentOfLatitudeRadians) +
    0.28 * Math.sin(lunarMeanAnomalyRadians + argumentOfLatitudeRadians) +
    0.277 * Math.sin(lunarMeanAnomalyRadians - argumentOfLatitudeRadians) +
    0.173 * Math.sin(2 * meanElongationRadians - argumentOfLatitudeRadians) +
    0.055 *
      Math.sin(2 * meanElongationRadians + argumentOfLatitudeRadians - lunarMeanAnomalyRadians) +
    0.046 *
      Math.sin(2 * meanElongationRadians - argumentOfLatitudeRadians - lunarMeanAnomalyRadians) +
    0.033 * Math.sin(2 * meanElongationRadians + argumentOfLatitudeRadians) +
    0.017 * Math.sin(2 * lunarMeanAnomalyRadians + argumentOfLatitudeRadians);

  const distanceKilometers =
    385_000.56 -
    20_905.355 * Math.cos(lunarMeanAnomalyRadians) -
    3_699.111 * Math.cos(2 * meanElongationRadians - lunarMeanAnomalyRadians) -
    2_955.968 * Math.cos(2 * meanElongationRadians) -
    569.925 * Math.cos(2 * lunarMeanAnomalyRadians);

  // ponytail: current true-of-date correction only补到简化章动项，先服务朔望与月相；
  // 需要长期高精度或全量 ELP2000 系数时再替换这一低阶模型。
  const apparentLongitudeDegrees = normalizeDegrees(
    eclipticLongitudeDegrees + nutationInLongitudeDegrees(centuriesSinceJ2000, meanLongitudeDegrees)
  );

  return {
    eclipticLongitudeDegrees,
    apparentLongitudeDegrees,
    latitudeDegrees,
    distanceAu: distanceKilometers / ASTRONOMICAL_UNIT_KILOMETERS
  };
}

/**
 * 计算简化章动黄经修正。
 *
 * @param centuriesSinceJ2000 距 J2000 的儒略世纪数。
 * @param meanLongitudeDegrees 月亮平黄经。
 * @returns 黄经章动修正，单位为度。
 */
function nutationInLongitudeDegrees(
  centuriesSinceJ2000: number,
  meanLongitudeDegrees: number
): number {
  const omegaRadians = toRadians(normalizeDegrees(125.04452 - 1934.136261 * centuriesSinceJ2000));
  const solarMeanLongitudeRadians = toRadians(
    normalizeDegrees(280.4665 + 36000.7698 * centuriesSinceJ2000)
  );
  const lunarMeanLongitudeRadians = toRadians(meanLongitudeDegrees);

  return (
    (-17.2 * Math.sin(omegaRadians) -
      1.32 * Math.sin(2 * solarMeanLongitudeRadians) -
      0.23 * Math.sin(2 * lunarMeanLongitudeRadians) +
      0.21 * Math.sin(2 * omegaRadians)) /
    3600
  );
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
