import { Angle } from "@epheon/primitives";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import type { PhenomenaContext } from "./solar-terms";
import {
  createInstantFromUtcMilliseconds,
  isBracket,
  normalizeSignedDegrees,
  toUtcMilliseconds
} from "./internal/helpers";

const SEARCH_STEP_MILLISECONDS = 6 * 60 * 60 * 1000;
const ROOT_TOLERANCE_MILLISECONDS = 1000;

/**
 * 朔望事件类型。
 */
export const LunarPhaseKind = {
  NewMoon: "NEW_MOON",
  FullMoon: "FULL_MOON"
} as const;

/** 朔望事件类型字面量联合。 */
export type LunarPhaseKind = (typeof LunarPhaseKind)[keyof typeof LunarPhaseKind];

/**
 * 单个朔望事件。
 */
export type LunarPhaseEvent = {
  /** 事件类型。 */
  readonly kind: LunarPhaseKind;
  /** 对应的目标日月黄经差。 */
  readonly targetLongitudeDifference: Angle;
  /** 事件发生时刻。 */
  readonly instant: Instant;
};

/**
 * 在给定时间窗内寻找一个朔或望事件。
 *
 * @param kind 目标朔望类型。
 * @param start 搜索起点。
 * @param end 搜索终点。
 * @param context 求解所需的 ephemeris、leap second 与 Delta-T context。
 * @returns 收敛后的朔望事件。
 * @throws {RangeError} 当搜索时间窗不是严格递增时抛出。
 * @throws {Error} 当搜索时间窗内找不到包围区间时抛出。
 */
export function findLunarPhaseBetween(
  kind: LunarPhaseKind,
  start: Instant,
  end: Instant,
  context: PhenomenaContext
): LunarPhaseEvent {
  const startMilliseconds = toUtcMilliseconds(start);
  const endMilliseconds = toUtcMilliseconds(end);

  if (startMilliseconds >= endMilliseconds) {
    throw new RangeError("start must be earlier than end.");
  }

  const targetLongitudeDifferenceDegrees = targetLongitudeDifferenceDegreesOf(kind);

  return {
    kind,
    targetLongitudeDifference: Angle.fromDegrees(targetLongitudeDifferenceDegrees),
    instant: findLunarPhaseInstant(
      targetLongitudeDifferenceDegrees,
      startMilliseconds,
      endMilliseconds,
      context
    )
  };
}

function findLunarPhaseInstant(
  targetLongitudeDifferenceDegrees: number,
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): Instant {
  let leftMilliseconds = startMilliseconds;
  let leftInstant = createInstantFromUtcMilliseconds(leftMilliseconds, context);
  let leftDifference = lunarPhaseDifferenceDegrees(
    leftInstant,
    targetLongitudeDifferenceDegrees,
    context
  );

  // ponytail: fixed 6-hour stride is enough for bootstrap new/full moon windows;
  // tighten it only if future fixtures show missed brackets.
  for (
    let rightMilliseconds = leftMilliseconds + SEARCH_STEP_MILLISECONDS;
    rightMilliseconds <= endMilliseconds;
    rightMilliseconds += SEARCH_STEP_MILLISECONDS
  ) {
    const rightInstant = createInstantFromUtcMilliseconds(rightMilliseconds, context);
    const rightDifference = lunarPhaseDifferenceDegrees(
      rightInstant,
      targetLongitudeDifferenceDegrees,
      context
    );

    if (isBracket(leftDifference, rightDifference)) {
      const instant = bisectLunarPhase(
        targetLongitudeDifferenceDegrees,
        leftMilliseconds,
        rightMilliseconds,
        leftDifference,
        rightDifference,
        context
      );

      // 收敛后验证实际日月黄经差是否接近目标值，过滤跨 180° 边界的误判。
      if (isPhaseNearTarget(instant, targetLongitudeDifferenceDegrees, context)) {
        return instant;
      }
    }

    leftMilliseconds = rightMilliseconds;
    leftInstant = rightInstant;
    leftDifference = rightDifference;
  }

  throw new Error(
    `Lunar phase bracket not found for longitude difference ${targetLongitudeDifferenceDegrees}.`
  );
}

function bisectLunarPhase(
  targetLongitudeDifferenceDegrees: number,
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
    const middleDifference = lunarPhaseDifferenceDegrees(
      middleInstant,
      targetLongitudeDifferenceDegrees,
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

function lunarPhaseDifferenceDegrees(
  instant: Instant,
  targetLongitudeDifferenceDegrees: number,
  context: PhenomenaContext
): number {
  const moonLongitudeDegrees = context.ephemeris
    .position(Body.Moon, instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    })
    .coordinates.longitude.normalizeDegrees()
    .toDegrees();
  const sunLongitudeDegrees = context.ephemeris
    .position(Body.Sun, instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    })
    .coordinates.longitude.normalizeDegrees()
    .toDegrees();

  return normalizeSignedDegrees(
    moonLongitudeDegrees - sunLongitudeDegrees - targetLongitudeDifferenceDegrees
  );
}

function targetLongitudeDifferenceDegreesOf(kind: LunarPhaseKind): number {
  return kind === LunarPhaseKind.FullMoon ? 180 : 0;
}

/**
 * 验证收敛后的日月黄经差是否接近目标值，过滤因跨 ±180° 边界产生的误判。
 *
 * 误判场景：搜索全月（target=180°）时，新月（moonLon≈sunLon）处的事件函数值会
 * 从 179° 跳变到 -179°，isBracket 检测到变号，但实际黄经差为 0° 而非 180°。
 *
 * 当前使用 10° 阈值：对于 6 小时步进算法，正确的包围区间两端不会差太远。
 */
function isPhaseNearTarget(
  instant: Instant,
  targetLongitudeDifferenceDegrees: number,
  context: PhenomenaContext
): boolean {
  const moonLon = context.ephemeris
    .position(Body.Moon, instant, { frame: ReferenceFrame.TrueOfDateEcliptic })
    .coordinates.longitude.normalizeDegrees()
    .toDegrees();
  const sunLon = context.ephemeris
    .position(Body.Sun, instant, { frame: ReferenceFrame.TrueOfDateEcliptic })
    .coordinates.longitude.normalizeDegrees()
    .toDegrees();
  const rawDifference = normalizeSignedDegrees(moonLon - sunLon - targetLongitudeDifferenceDegrees);

  return Math.abs(rawDifference) < 10;
}
