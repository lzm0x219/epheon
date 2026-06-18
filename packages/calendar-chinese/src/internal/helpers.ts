import { type PhenomenaContext, findLunarPhaseBetween, LunarPhaseKind } from "@epheon/phenomena";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";

/**
 * 将 Instant 换算为 UTC 毫秒时间戳。
 *
 * @param instant 要换算的时刻。
 * @returns 对应物理时刻的 UTC 毫秒时间戳。
 */
export function toUtcMilliseconds(instant: Instant): number {
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

/**
 * 从 UTC 毫秒时间戳构造 Instant。
 *
 * @param milliseconds UTC 毫秒时间戳。
 * @param context 需要 leapSeconds 和 deltaT 的最小上下文。
 * @returns 新的 Instant 值对象。
 */
export function createInstantFromUtcMilliseconds(
  milliseconds: number,
  context: Pick<PhenomenaContext, "leapSeconds" | "deltaT">
): Instant {
  return Instant.fromUTC(new Date(milliseconds).toISOString(), {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  });
}

/** JavaScript 取模（结果始终非负）。 */
export function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** 将角度标准化到 [0, 360)。 */
export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * 判断给定黄经是否属于中气（为 30° 整数倍）。
 *
 * @param longitudeDegrees 黄经度数。
 * @returns 该黄经为 30° 整数倍时返回 true。
 */
export function isPrincipalTermLongitude(longitudeDegrees: number): boolean {
  const remainder = normalizeDegrees(longitudeDegrees) % 30;

  return remainder < 1e-9 || 30 - remainder < 1e-9;
}

/**
 * 计算给定时刻的日月黄经差（度）。
 *
 * @param instant 要评估的时刻。
 * @param context 天象求解上下文。
 * @returns 已标准化到 [0, 360) 的日月黄经差。
 */
export function lunarElongationDegrees(instant: Instant, context: PhenomenaContext): number {
  const moonLongitudeDegrees = context.ephemeris
    .position(Body.Moon, instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    })
    .coordinates.longitude.toDegrees();
  const sunLongitudeDegrees = context.ephemeris
    .position(Body.Sun, instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    })
    .coordinates.longitude.toDegrees();

  return normalizeDegrees(moonLongitudeDegrees - sunLongitudeDegrees);
}

/** Gregorian 日期 → Julian Day Number（整数日）。 */
export function gregorianToJulianDayNumber(year: number, month: number, day: number): number {
  const adjustment = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - adjustment;
  const adjustedMonth = month + 12 * adjustment - 3;

  return (
    day +
    Math.floor((153 * adjustedMonth + 2) / 5) +
    365 * adjustedYear +
    Math.floor(adjustedYear / 4) -
    Math.floor(adjustedYear / 100) +
    Math.floor(adjustedYear / 400) -
    32045
  );
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const NEW_MOON_WINDOW_MILLISECONDS = 32 * DAY_IN_MILLISECONDS;
const NEW_MOON_SCAN_STEP_MILLISECONDS = 6 * 60 * 60 * 1000;

/**
 * 收集指定 UTC 毫秒时间窗内所有朔时刻。
 *
 * @param startMilliseconds 搜索起点。
 * @param endMilliseconds 搜索终点。
 * @param context 天象求解上下文。
 * @returns 按时刻升序排列的朔时刻列表。
 */
export function collectNewMoonStarts(
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): readonly Instant[] {
  const newMoonStarts: Instant[] = [];
  let leftMilliseconds = startMilliseconds - NEW_MOON_WINDOW_MILLISECONDS;
  let leftInstant = createInstantFromUtcMilliseconds(leftMilliseconds, context);
  let leftElongation = lunarElongationDegrees(leftInstant, context);
  const searchLimitMilliseconds = endMilliseconds + NEW_MOON_WINDOW_MILLISECONDS;

  for (
    let rightMilliseconds = leftMilliseconds + NEW_MOON_SCAN_STEP_MILLISECONDS;
    rightMilliseconds <= searchLimitMilliseconds;
    rightMilliseconds += NEW_MOON_SCAN_STEP_MILLISECONDS
  ) {
    const rightInstant = createInstantFromUtcMilliseconds(rightMilliseconds, context);
    const rightElongation = lunarElongationDegrees(rightInstant, context);

    if (rightElongation < leftElongation) {
      newMoonStarts.push(
        findLunarPhaseBetween(LunarPhaseKind.NewMoon, leftInstant, rightInstant, context).instant
      );
    }

    leftMilliseconds = rightMilliseconds;
    leftInstant = rightInstant;
    leftElongation = rightElongation;
  }

  return newMoonStarts;
}

/**
 * 返回指定 UTC 毫秒时间戳对应的本地日期字段。
 *
 * @param instant 要换算的时刻。
 * @param offsetMinutes 本地 UTC offset（分钟）。
 * @returns 本地日期 year/month/day/hour。
 */
export function toLocalDateFields(
  instant: Instant,
  offsetMinutes: number
): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
} {
  const localDate = new Date(toUtcMilliseconds(instant) + offsetMinutes * 60_000);

  return {
    year: localDate.getUTCFullYear(),
    month: localDate.getUTCMonth() + 1,
    day: localDate.getUTCDate(),
    hour: localDate.getUTCHours()
  };
}

/** 返回指定时刻在以给定 offset 表示的本地日期所在年份。 */
export function toLocalYear(instant: Instant, offsetMinutes: number): number {
  return toLocalDateFields(instant, offsetMinutes).year;
}

/**
 * 返回从纪元（1970-01-01）起算的本地日序数。
 *
 * @param instant 要换算的时刻。
 * @param offsetMinutes 本地 UTC offset（分钟）。
 * @returns 对应的本地日序数。
 */
export function toLocalDaySerial(instant: Instant, offsetMinutes: number): number {
  return Math.floor((toUtcMilliseconds(instant) + offsetMinutes * 60_000) / DAY_IN_MILLISECONDS);
}

/**
 * 判断月段是否与查询窗口重叠。
 *
 * @param month 农历月段。
 * @param startMilliseconds 查询窗口起点。
 * @param endMilliseconds 查询窗口终点。
 * @returns 存在重叠时返回 true。
 */
export function overlapsWindow(
  month: { readonly start: Instant; readonly end: Instant },
  startMilliseconds: number,
  endMilliseconds: number
): boolean {
  return (
    toUtcMilliseconds(month.end) > startMilliseconds &&
    toUtcMilliseconds(month.start) < endMilliseconds
  );
}

/** 月编号递增（12 之后回到 1）。 */
export function nextMonthNumber(monthNumber: number): number {
  return monthNumber === 12 ? 1 : monthNumber + 1;
}

/** 月编号递减（1 之后回到 12）。 */
export function previousMonthNumber(monthNumber: number): number {
  return monthNumber === 1 ? 12 : monthNumber - 1;
}

/**
 * 断言数组严格递增。
 *
 * @param values 要检查的数值数组。
 * @param label 用于错误消息的标识。
 * @throws {RangeError} 当数组不严格递增时抛出。
 */
export function assertStrictlyIncreasing(values: readonly number[], label: string): void {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! <= values[index - 1]!) {
      throw new RangeError(`${label} must be strictly increasing.`);
    }
  }
}
