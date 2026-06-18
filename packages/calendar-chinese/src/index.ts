import {
  findLunarPhaseBetween,
  LunarPhaseKind,
  solarTermsOfYear,
  type PhenomenaContext
} from "@epheon/phenomena";
import { Instant } from "@epheon/temporal";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SEARCH_PADDING_MILLISECONDS = 35 * DAY_IN_MILLISECONDS;
const NEW_MOON_WINDOW_MILLISECONDS = 32 * DAY_IN_MILLISECONDS;
const SEARCH_EPSILON_MILLISECONDS = 60 * 1000;

/** 农历月序中的单个月段。 */
export type ChineseLunarMonth = {
  /** 该月对应的朔时刻。 */
  readonly start: Instant;
  /** 下一次朔时刻，也就是该月的结束边界。 */
  readonly end: Instant;
  /** 该月内是否包含中气。 */
  readonly containsPrincipalTerm: boolean;
  /** 该月是否被判定为闰月。 */
  readonly isLeapMonth: boolean;
};

/** 可直接消费的农历月表条目。 */
export type ChineseLunarMonthTableEntry = ChineseLunarMonth & {
  /** 返回结果内的顺序编号，从 1 开始。 */
  readonly sequence: number;
};

/**
 * 根据一组连续朔时刻与中气时刻，构建最小农历月序。
 *
 * 当前规则只做两件事：
 * 1. 用相邻朔时刻切出月段；
 * 2. 把第一个不含中气的月段标记为闰月。
 *
 * @param newMoonStarts 按时刻升序排列的连续朔时刻，至少需要两个。
 * @param principalTerms 按时刻升序排列的中气时刻。
 * @returns 按月段顺序排列的最小农历月序。
 * @throws {RangeError} 当朔时刻或中气时刻不是严格升序时抛出。
 */
export function buildLunarMonthSequence(
  newMoonStarts: readonly Instant[],
  principalTerms: readonly Instant[]
): readonly ChineseLunarMonth[] {
  if (newMoonStarts.length < 2) {
    return [];
  }

  const newMoonStartTimes = newMoonStarts.map(toUtcMilliseconds);
  const principalTermTimes = principalTerms.map(toUtcMilliseconds);

  assertStrictlyIncreasing(newMoonStartTimes, "newMoonStarts");
  assertStrictlyIncreasing(principalTermTimes, "principalTerms");

  let leapMonthAssigned = false;

  return newMoonStarts.slice(0, -1).map((start, index) => {
    const startMilliseconds = newMoonStartTimes[index]!;
    const endMilliseconds = newMoonStartTimes[index + 1]!;
    const containsPrincipalTerm = principalTermTimes.some(
      (termMilliseconds) =>
        termMilliseconds >= startMilliseconds && termMilliseconds < endMilliseconds
    );
    const isLeapMonth = !leapMonthAssigned && !containsPrincipalTerm;

    if (isLeapMonth) {
      leapMonthAssigned = true;
    }

    // ponytail: scan all principal terms for each lunation; current inputs are tiny,
    // switch to a shared cursor only if real fixture sizes make this measurable.
    return {
      start,
      end: newMoonStarts[index + 1]!,
      containsPrincipalTerm,
      isLeapMonth
    };
  });
}

/**
 * 返回与指定 UTC 时间窗重叠的农历月表。
 *
 * 当前实现只收口到“稳定月表”：
 * 1. 自动拼接朔与中气输入；
 * 2. 返回顺序编号、闰月标记与起止边界；
 * 3. 暂不补月份编号与农历日期映射。
 *
 * @param start 查询窗口起点，按 UTC 时刻比较。
 * @param end 查询窗口终点，必须晚于 start。
 * @param context 节气与朔计算所需的最小上下文。
 * @returns 与查询窗口重叠的农历月表条目。
 * @throws {RangeError} 当查询窗口不是严格递增时抛出。
 */
export function lunarMonthTableBetween(
  start: Instant,
  end: Instant,
  context: PhenomenaContext
): readonly ChineseLunarMonthTableEntry[] {
  const startMilliseconds = toUtcMilliseconds(start);
  const endMilliseconds = toUtcMilliseconds(end);

  if (startMilliseconds >= endMilliseconds) {
    throw new RangeError("start must be earlier than end.");
  }

  const expandedStartMilliseconds = startMilliseconds - SEARCH_PADDING_MILLISECONDS;
  const expandedEndMilliseconds = endMilliseconds + SEARCH_PADDING_MILLISECONDS;
  const principalTerms = collectPrincipalTerms(
    expandedStartMilliseconds,
    expandedEndMilliseconds,
    context
  );
  const newMoonStarts = collectNewMoonStarts(
    expandedStartMilliseconds,
    expandedEndMilliseconds,
    context
  );

  return buildLunarMonthSequence(newMoonStarts, principalTerms)
    .filter((month) => overlapsWindow(month, startMilliseconds, endMilliseconds))
    .map((month, index) => ({
      ...month,
      sequence: index + 1
    }));
}

/**
 * 返回指定 UTC Gregorian 年份内可直接消费的农历月表。
 *
 * @param year 目标 UTC Gregorian 年份。
 * @param context 节气与朔计算所需的最小上下文。
 * @returns 与该 UTC 年份重叠的农历月表条目。
 * @throws {RangeError} 当 year 不是整数时抛出。
 */
export function lunarMonthTableOfYear(
  year: number,
  context: PhenomenaContext
): readonly ChineseLunarMonthTableEntry[] {
  if (!Number.isInteger(year)) {
    throw new RangeError("year must be an integer.");
  }

  return lunarMonthTableBetween(
    createInstantFromUtcMilliseconds(Date.UTC(year, 0, 1), context),
    createInstantFromUtcMilliseconds(Date.UTC(year + 1, 0, 1), context),
    context
  );
}

function assertStrictlyIncreasing(values: readonly number[], label: string): void {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! <= values[index - 1]!) {
      throw new RangeError(`${label} must be strictly increasing.`);
    }
  }
}

function collectPrincipalTerms(
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): readonly Instant[] {
  const startYear = new Date(startMilliseconds).getUTCFullYear();
  const endYear = new Date(endMilliseconds).getUTCFullYear();
  const principalTerms: Instant[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const terms = solarTermsOfYear(year, context);

    for (const term of terms) {
      const targetLongitudeDegrees = term.targetLongitude.normalizeDegrees().toDegrees();
      const termMilliseconds = toUtcMilliseconds(term.instant);

      if (
        targetLongitudeDegrees % 30 === 0 &&
        termMilliseconds >= startMilliseconds &&
        termMilliseconds < endMilliseconds
      ) {
        principalTerms.push(term.instant);
      }
    }
  }

  return principalTerms;
}

function collectNewMoonStarts(
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): readonly Instant[] {
  const newMoonStarts: Instant[] = [];
  let cursorMilliseconds = startMilliseconds;
  const searchLimitMilliseconds = endMilliseconds + NEW_MOON_WINDOW_MILLISECONDS;

  while (cursorMilliseconds < searchLimitMilliseconds) {
    const newMoon = findLunarPhaseBetween(
      LunarPhaseKind.NewMoon,
      createInstantFromUtcMilliseconds(cursorMilliseconds, context),
      createInstantFromUtcMilliseconds(cursorMilliseconds + NEW_MOON_WINDOW_MILLISECONDS, context),
      context
    );
    const newMoonMilliseconds = toUtcMilliseconds(newMoon.instant);

    newMoonStarts.push(newMoon.instant);
    cursorMilliseconds = newMoonMilliseconds + SEARCH_EPSILON_MILLISECONDS;
  }

  return newMoonStarts;
}

function overlapsWindow(
  month: ChineseLunarMonth,
  startMilliseconds: number,
  endMilliseconds: number
): boolean {
  return (
    toUtcMilliseconds(month.end) > startMilliseconds &&
    toUtcMilliseconds(month.start) < endMilliseconds
  );
}

function createInstantFromUtcMilliseconds(
  milliseconds: number,
  context: Pick<PhenomenaContext, "leapSeconds" | "deltaT">
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
