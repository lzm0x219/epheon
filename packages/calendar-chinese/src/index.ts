import { type PhenomenaContext } from "@epheon/phenomena";
import { Instant } from "@epheon/temporal";
import {
  collectSolarTermsForYears,
  resolveGanzhiDay,
  resolveGanzhiHour,
  resolveGanzhiMonth,
  resolveGanzhiYear
} from "./internal/ganzhi";
import {
  assertStrictlyIncreasing,
  createInstantFromUtcMilliseconds,
  toLocalDaySerial,
  toUtcMilliseconds,
  overlapsWindow
} from "./internal/helpers";
import { buildResolvedChineseLunarMonths } from "./internal/month-building";

// ============================================================
// 公共类型
// ============================================================

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
  /** 该月对应的农历年。 */
  readonly year: number;
  /** 该月对应的农历月编号。 */
  readonly month: number;
  /** 返回结果内的顺序编号，从 1 开始。 */
  readonly sequence: number;
};

/** 给定时刻对应的最小农历日期结果。 */
export type ChineseLunarDate = {
  /** 农历年，当前最小实现按 modern 规则返回整数年份。 */
  readonly year: number;
  /** 农历月编号，范围为 1-12。 */
  readonly month: number;
  /** 农历日编号，范围为 1-30。 */
  readonly day: number;
  /** 当前月份是否为闰月。 */
  readonly isLeapMonth: boolean;
};

/** 十天干。 */
export const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** 十二地支。 */
export const EARTHLY_BRANCHES = [
  "子",
  "丑",
  "寅",
  "卯",
  "辰",
  "巳",
  "午",
  "未",
  "申",
  "酉",
  "戌",
  "亥"
] as const;

/** 十天干字面量联合。 */
export type HeavenlyStem = (typeof HEAVENLY_STEMS)[number];

/** 十二地支字面量联合。 */
export type EarthlyBranch = (typeof EARTHLY_BRANCHES)[number];

/** 单个干支柱结果。 */
export type GanzhiPillar = {
  /** 天干。 */
  readonly stem: HeavenlyStem;
  /** 地支。 */
  readonly branch: EarthlyBranch;
  /** 干支组合名，例如"甲辰"。 */
  readonly name: `${HeavenlyStem}${EarthlyBranch}`;
};

/** 给定时刻对应的最小干支结果。 */
export type ChineseGanzhi = {
  /** 按立春切换的纪年。 */
  readonly year: GanzhiPillar;
  /** 按十二节切换的纪月。 */
  readonly month: GanzhiPillar;
  /** 按本地民用日切换的纪日。 */
  readonly day: GanzhiPillar;
  /** 按本地时区的十二时辰切换的纪时。 */
  readonly hour: GanzhiPillar;
};

// ============================================================
// 公共 API
// ============================================================

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const DATE_QUERY_WINDOW_MILLISECONDS = 400 * DAY_IN_MILLISECONDS;
const SEARCH_PADDING_MILLISECONDS = DATE_QUERY_WINDOW_MILLISECONDS;

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
 * 当前实现只收口到"稳定月表"：
 * 1. 自动拼接朔与中气输入；
 * 2. 返回农历年、月编号、闰月标记与起止边界；
 * 3. 年月语义按查询窗口起点的显式 offset 解释。
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

  return buildResolvedChineseLunarMonths(
    expandedStartMilliseconds,
    expandedEndMilliseconds,
    start,
    context
  )
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

/**
 * 返回给定时刻对应的最小农历日期。
 *
 * 当前实现只支持一个最小 modern 规则切片：
 * 1. 用包含冬至的月作为十一月锚点；
 * 2. 基于闰月标记推导月编号；
 * 3. 用输入 offset 解释农历日与农历年边界。
 *
 * @param instant 要查询的时刻，必须带显式 offset。
 * @param context 节气与朔计算所需的最小上下文。
 * @returns 对应时刻的农历年、月、日与闰月标记。
 */
export function lunarDateOf(instant: Instant, context: PhenomenaContext): ChineseLunarDate {
  const instantMilliseconds = toUtcMilliseconds(instant);
  const months = buildResolvedChineseLunarMonths(
    instantMilliseconds - DATE_QUERY_WINDOW_MILLISECONDS,
    instantMilliseconds + DATE_QUERY_WINDOW_MILLISECONDS,
    instant,
    context
  );
  const currentMonth = months.find((month) => {
    const startMilliseconds = toUtcMilliseconds(month.start);
    const endMilliseconds = toUtcMilliseconds(month.end);

    return instantMilliseconds >= startMilliseconds && instantMilliseconds < endMilliseconds;
  });

  if (currentMonth === undefined) {
    throw new RangeError("Unable to resolve the lunar month for the requested instant.");
  }

  const offsetMinutes = instant.toUTCFields().offsetMinutes;

  return {
    year: currentMonth.year,
    month: currentMonth.month,
    day:
      toLocalDaySerial(instant, offsetMinutes) -
      toLocalDaySerial(currentMonth.start, offsetMinutes) +
      1,
    isLeapMonth: currentMonth.isLeapMonth
  };
}

/**
 * 返回给定时刻对应的最小干支结果。
 *
 * 当前实现固定使用一个明确的 modern 规则切片：
 * 1. 纪年按立春切换；
 * 2. 纪月按十二节切换，立春起寅月；
 * 3. 纪日按输入 offset 对应的本地民用日切换；
 * 4. 纪时按本地时区的 23:00 子时起算。
 *
 * @param instant 要查询的时刻，必须带显式 offset。
 * @param context 节气求解所需的最小上下文。
 * @returns 对应时刻的纪年、纪月、纪日与纪时。
 */
export function ganzhiOf(instant: Instant, context: PhenomenaContext): ChineseGanzhi {
  const offsetMinutes = instant.toUTCFields().offsetMinutes;
  const localYear = toLocalYear(instant, offsetMinutes);
  const solarTerms = collectSolarTermsForYears(localYear - 1, localYear + 1, context);
  const year = resolveGanzhiYear(instant, solarTerms, offsetMinutes);
  const day = resolveGanzhiDay(instant, offsetMinutes);

  return {
    year: year.pillar,
    month: resolveGanzhiMonth(instant, solarTerms, year.stemIndex).pillar,
    day: day.pillar,
    hour: resolveGanzhiHour(instant, offsetMinutes, day.stemIndex).pillar
  };
}

// ============================================================
// 内部辅助
// ============================================================

function toLocalYear(instant: Instant, offsetMinutes: number): number {
  return toLocalDateFields(instant, offsetMinutes).year;
}

function toLocalDateFields(
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
