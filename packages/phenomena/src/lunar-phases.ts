import { Angle } from "@epheon/primitives";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import type { PhenomenaContext } from "./solar-terms";

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
      return bisectLunarPhase(
        targetLongitudeDifferenceDegrees,
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

function isBracket(left: number, right: number): boolean {
  return left === 0 || right === 0 || (left < 0 && right > 0) || (left > 0 && right < 0);
}

function createInstantFromUtcMilliseconds(
  milliseconds: number,
  context: PhenomenaContext
): Instant {
  return Instant.fromUTC(new Date(milliseconds).toISOString(), {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  });
}

function toUtcMilliseconds(instant: Instant): number {
  const fields = instant.toUTCFields();
  const wholeSeconds = Math.trunc(fields.second);
  const fractionalMilliseconds = Math.round((fields.second - wholeSeconds) * 1000);

  return (
    Date.UTC(
      fields.year,
      fields.month - 1,
      fields.day,
      fields.hour,
      fields.minute,
      wholeSeconds,
      fractionalMilliseconds
    ) -
    fields.offsetMinutes * 60_000
  );
}

function normalizeSignedDegrees(degrees: number): number {
  const normalized = (((degrees + 180) % 360) + 360) % 360;

  return normalized - 180;
}
