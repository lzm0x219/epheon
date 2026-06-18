import type { EphemerisProvider } from "@epheon/ephemerides";
import { Angle } from "@epheon/primitives";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant, type DeltaTProvider, type LeapSecondProvider } from "@epheon/temporal";
import {
  createInstantFromUtcMilliseconds,
  isBracket,
  normalizeSignedDegrees,
  toUtcMilliseconds
} from "./internal/helpers";

const SEARCH_STEP_MILLISECONDS = 24 * 60 * 60 * 1000;
const SEARCH_EPSILON_MILLISECONDS = 60 * 1000;
const ROOT_TOLERANCE_MILLISECONDS = 1000;

/**
 * 二十四节气名称。
 */
export const SolarTermName = {
  XiaoHan: "小寒",
  DaHan: "大寒",
  LiChun: "立春",
  YuShui: "雨水",
  JingZhe: "惊蛰",
  ChunFen: "春分",
  QingMing: "清明",
  GuYu: "谷雨",
  LiXia: "立夏",
  XiaoMan: "小满",
  MangZhong: "芒种",
  XiaZhi: "夏至",
  XiaoShu: "小暑",
  DaShu: "大暑",
  LiQiu: "立秋",
  ChuShu: "处暑",
  BaiLu: "白露",
  QiuFen: "秋分",
  HanLu: "寒露",
  ShuangJiang: "霜降",
  LiDong: "立冬",
  XiaoXue: "小雪",
  DaXue: "大雪",
  DongZhi: "冬至"
} as const;

/** 二十四节气名称字面量联合。 */
export type SolarTermName = (typeof SolarTermName)[keyof typeof SolarTermName];

/**
 * 天象求解所需的最小上下文。
 */
export type PhenomenaContext = {
  /** 太阳或月亮位置的统一 provider。 */
  readonly ephemeris: EphemerisProvider;
  /** 从 UTC 构造 Instant 时需要的闰秒 provider。 */
  readonly leapSeconds: LeapSecondProvider;
  /** 供后续节气 / 朔望实现显式持有的 Delta-T provider。 */
  readonly deltaT: DeltaTProvider;
};

/**
 * 单个节气事件。
 */
export type SolarTermEvent = {
  /** 节气名称。 */
  readonly name: SolarTermName;
  /** 对应的目标黄经。 */
  readonly targetLongitude: Angle;
  /** 节气发生时刻。 */
  readonly instant: Instant;
};

type SolarTermDefinition = {
  readonly name: SolarTermName;
  readonly targetLongitudeDegrees: number;
};

const SOLAR_TERM_DEFINITIONS: readonly SolarTermDefinition[] = [
  { name: SolarTermName.XiaoHan, targetLongitudeDegrees: 285 },
  { name: SolarTermName.DaHan, targetLongitudeDegrees: 300 },
  { name: SolarTermName.LiChun, targetLongitudeDegrees: 315 },
  { name: SolarTermName.YuShui, targetLongitudeDegrees: 330 },
  { name: SolarTermName.JingZhe, targetLongitudeDegrees: 345 },
  { name: SolarTermName.ChunFen, targetLongitudeDegrees: 0 },
  { name: SolarTermName.QingMing, targetLongitudeDegrees: 15 },
  { name: SolarTermName.GuYu, targetLongitudeDegrees: 30 },
  { name: SolarTermName.LiXia, targetLongitudeDegrees: 45 },
  { name: SolarTermName.XiaoMan, targetLongitudeDegrees: 60 },
  { name: SolarTermName.MangZhong, targetLongitudeDegrees: 75 },
  { name: SolarTermName.XiaZhi, targetLongitudeDegrees: 90 },
  { name: SolarTermName.XiaoShu, targetLongitudeDegrees: 105 },
  { name: SolarTermName.DaShu, targetLongitudeDegrees: 120 },
  { name: SolarTermName.LiQiu, targetLongitudeDegrees: 135 },
  { name: SolarTermName.ChuShu, targetLongitudeDegrees: 150 },
  { name: SolarTermName.BaiLu, targetLongitudeDegrees: 165 },
  { name: SolarTermName.QiuFen, targetLongitudeDegrees: 180 },
  { name: SolarTermName.HanLu, targetLongitudeDegrees: 195 },
  { name: SolarTermName.ShuangJiang, targetLongitudeDegrees: 210 },
  { name: SolarTermName.LiDong, targetLongitudeDegrees: 225 },
  { name: SolarTermName.XiaoXue, targetLongitudeDegrees: 240 },
  { name: SolarTermName.DaXue, targetLongitudeDegrees: 255 },
  { name: SolarTermName.DongZhi, targetLongitudeDegrees: 270 }
] as const;

/**
 * 返回指定 UTC Gregorian year 内的 24 个节气。
 *
 * 当前实现先用日步进找到包围区间，再用二分法细化到秒级。
 *
 * @param year 目标 UTC Gregorian year。
 * @param context 求解所需的 ephemeris、leap second 与 Delta-T context。
 * @returns 按时刻升序排列的 24 个节气事件。
 * @throws {RangeError} 当 year 不是有限整数时抛出。
 * @throws {Error} 当无法为某个节气找到包围区间时抛出。
 */
export function solarTermsOfYear(
  year: number,
  context: PhenomenaContext
): readonly SolarTermEvent[] {
  if (!Number.isInteger(year)) {
    throw new RangeError("year must be an integer.");
  }

  let searchStartMilliseconds = Date.UTC(year, 0, 1, 0, 0, 0, 0);
  const searchEndMilliseconds = Date.UTC(year + 1, 0, 1, 0, 0, 0, 0);

  return SOLAR_TERM_DEFINITIONS.map((definition) => {
    const instant = findSolarTermInstant(
      definition.targetLongitudeDegrees,
      searchStartMilliseconds,
      searchEndMilliseconds,
      context
    );

    searchStartMilliseconds = toUtcMilliseconds(instant) + SEARCH_EPSILON_MILLISECONDS;

    return {
      name: definition.name,
      targetLongitude: Angle.fromDegrees(definition.targetLongitudeDegrees),
      instant
    };
  });
}

/**
 * 为单个目标黄经寻找节气时刻。
 *
 * @param targetLongitudeDegrees 节气目标黄经。
 * @param startMilliseconds 搜索起点。
 * @param endMilliseconds 搜索终点。
 * @param context 求解上下文。
 * @returns 节气发生时刻。
 */
function findSolarTermInstant(
  targetLongitudeDegrees: number,
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): Instant {
  let leftMilliseconds = startMilliseconds;
  let leftInstant = createInstantFromUtcMilliseconds(leftMilliseconds, context);
  let leftDifference = solarTermDifferenceDegrees(leftInstant, targetLongitudeDegrees, context);

  for (
    let rightMilliseconds = leftMilliseconds + SEARCH_STEP_MILLISECONDS;
    rightMilliseconds <= endMilliseconds;
    rightMilliseconds += SEARCH_STEP_MILLISECONDS
  ) {
    const rightInstant = createInstantFromUtcMilliseconds(rightMilliseconds, context);
    const rightDifference = solarTermDifferenceDegrees(
      rightInstant,
      targetLongitudeDegrees,
      context
    );

    if (isBracket(leftDifference, rightDifference)) {
      return bisectSolarTerm(
        targetLongitudeDegrees,
        leftMilliseconds,
        rightMilliseconds,
        leftDifference,
        rightDifference,
        context
      );
    }

    leftMilliseconds = rightMilliseconds;
    leftInstant = rightInstant;
    leftDifference = rightDifference;
  }

  throw new Error(`Solar term bracket not found for longitude ${targetLongitudeDegrees}.`);
}

/**
 * 使用二分法在已知包围区间内细化节气时刻。
 *
 * @param targetLongitudeDegrees 节气目标黄经。
 * @param leftMilliseconds 包围区间左端点。
 * @param rightMilliseconds 包围区间右端点。
 * @param leftDifference 左端点事件函数值。
 * @param rightDifference 右端点事件函数值。
 * @param context 求解上下文。
 * @returns 收敛后的节气时刻。
 */
function bisectSolarTerm(
  targetLongitudeDegrees: number,
  leftMilliseconds: number,
  rightMilliseconds: number,
  leftDifference: number,
  rightDifference: number,
  context: PhenomenaContext
): Instant {
  let currentLeftMilliseconds = leftMilliseconds;
  let currentRightMilliseconds = rightMilliseconds;
  let currentLeftDifference = leftDifference;
  let currentRightDifference = rightDifference;

  while (currentRightMilliseconds - currentLeftMilliseconds > ROOT_TOLERANCE_MILLISECONDS) {
    const middleMilliseconds = Math.floor((currentLeftMilliseconds + currentRightMilliseconds) / 2);
    const middleInstant = createInstantFromUtcMilliseconds(middleMilliseconds, context);
    const middleDifference = solarTermDifferenceDegrees(
      middleInstant,
      targetLongitudeDegrees,
      context
    );

    if (isBracket(currentLeftDifference, middleDifference)) {
      currentRightMilliseconds = middleMilliseconds;
      currentRightDifference = middleDifference;
      continue;
    }

    currentLeftMilliseconds = middleMilliseconds;
    currentLeftDifference = middleDifference;
  }

  const leftInstant = createInstantFromUtcMilliseconds(currentLeftMilliseconds, context);
  const rightInstant = createInstantFromUtcMilliseconds(currentRightMilliseconds, context);

  return Math.abs(currentLeftDifference) <= Math.abs(currentRightDifference)
    ? leftInstant
    : rightInstant;
}

/**
 * 计算节气事件函数值：太阳地心视黄经减目标黄经。
 *
 * @param instant 要评估的时刻。
 * @param targetLongitudeDegrees 节气目标黄经。
 * @param context 求解上下文。
 * @returns 已归一化到 [-180, 180) 的角度差。
 */
function solarTermDifferenceDegrees(
  instant: Instant,
  targetLongitudeDegrees: number,
  context: PhenomenaContext
): number {
  const longitudeDegrees = context.ephemeris
    .position(Body.Sun, instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    })
    .coordinates.longitude.normalizeDegrees()
    .toDegrees();

  return normalizeSignedDegrees(longitudeDegrees - targetLongitudeDegrees);
}
