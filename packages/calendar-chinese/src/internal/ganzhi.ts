import {
  SolarTermName,
  solarTermsOfYear,
  type PhenomenaContext,
  type SolarTermEvent
} from "@epheon/phenomena";
import { Instant } from "@epheon/temporal";
import {
  gregorianToJulianDayNumber,
  modulo,
  toLocalDateFields,
  toUtcMilliseconds
} from "./helpers";

/** 十天干。 */
const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** 十二地支。 */
const EARTHLY_BRANCHES = [
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

/** 内部干支柱结果。 */
type ResolvedGanzhiPillar = {
  readonly stemIndex: number;
  readonly branchIndex: number;
  readonly pillar: {
    readonly stem: (typeof HEAVENLY_STEMS)[number];
    readonly branch: (typeof EARTHLY_BRANCHES)[number];
    readonly name: `${(typeof HEAVENLY_STEMS)[number]}${(typeof EARTHLY_BRANCHES)[number]}`;
  };
};

/**
 * 收集指定年份范围的所有节气事件。
 *
 * @param startYear 起始年份（含）。
 * @param endYear 结束年份（含）。
 * @param context 天象求解上下文。
 * @returns 所有节气事件列表。
 */
export function collectSolarTermsForYears(
  startYear: number,
  endYear: number,
  context: PhenomenaContext
): readonly SolarTermEvent[] {
  const solarTerms: SolarTermEvent[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    solarTerms.push(...solarTermsOfYear(year, context));
  }

  return solarTerms;
}

/**
 * 解析纪年干支（按立春切换）。
 *
 * @param instant 要查询的时刻。
 * @param solarTerms 包含附近年份的节气列表。
 * @param offsetMinutes 本地 UTC offset。
 * @returns 内部干支柱结果。
 */
export function resolveGanzhiYear(
  instant: Instant,
  solarTerms: readonly SolarTermEvent[],
  offsetMinutes: number
): ResolvedGanzhiPillar {
  const lichun = findLatestSolarTerm(
    instant,
    solarTerms,
    (term) => term.name === SolarTermName.LiChun
  );
  const year = toLocalDateFields(lichun.instant, offsetMinutes).year;
  const sexagenaryIndex = modulo(year - 4, 60);

  return createResolvedGanzhiPillar(sexagenaryIndex % 10, sexagenaryIndex % 12);
}

/**
 * 解析纪月干支（按十二节切换，立春起寅月）。
 *
 * @param instant 要查询的时刻。
 * @param solarTerms 包含附近年份的节气列表。
 * @param yearStemIndex 纪年天干索引。
 * @returns 内部干支柱结果。
 */
export function resolveGanzhiMonth(
  instant: Instant,
  solarTerms: readonly SolarTermEvent[],
  yearStemIndex: number
): ResolvedGanzhiPillar {
  const boundary = findLatestSolarTerm(
    instant,
    solarTerms,
    (term) => monthBoundaryOffsetOf(term) >= 0
  );
  const monthOffset = monthBoundaryOffsetOf(boundary);
  const stemStartIndex = modulo((yearStemIndex % 5) * 2 + 2, 10);

  return createResolvedGanzhiPillar(
    modulo(stemStartIndex + monthOffset, 10),
    modulo(2 + monthOffset, 12)
  );
}

/**
 * 解析纪日干支（按本地民用日切换）。
 *
 * @param instant 要查询的时刻。
 * @param offsetMinutes 本地 UTC offset。
 * @returns 内部干支柱结果。
 */
export function resolveGanzhiDay(instant: Instant, offsetMinutes: number): ResolvedGanzhiPillar {
  const localDate = toLocalDateFields(instant, offsetMinutes);
  const julianDayNumber = gregorianToJulianDayNumber(
    localDate.year,
    localDate.month,
    localDate.day
  );
  const sexagenaryIndex = modulo(julianDayNumber + 49, 60);

  return createResolvedGanzhiPillar(sexagenaryIndex % 10, sexagenaryIndex % 12);
}

/**
 * 解析纪时干支（按 23:00 子时起算）。
 *
 * @param instant 要查询的时刻。
 * @param offsetMinutes 本地 UTC offset。
 * @param dayStemIndex 纪日天干索引。
 * @returns 内部干支柱结果。
 */
export function resolveGanzhiHour(
  instant: Instant,
  offsetMinutes: number,
  dayStemIndex: number
): ResolvedGanzhiPillar {
  const localDate = toLocalDateFields(instant, offsetMinutes);
  const hourBranchIndex = modulo(Math.floor((localDate.hour + 1) / 2), 12);
  const hourStemStartIndex = (dayStemIndex % 5) * 2;

  return createResolvedGanzhiPillar(
    modulo(hourStemStartIndex + hourBranchIndex, 10),
    hourBranchIndex
  );
}

/**
 * 返回给定节气对应的月偏移量（立春为 0）。
 *
 * @param term 节气事件。
 * @returns 月偏移量；非月界节气返回 -1。
 */
export function monthBoundaryOffsetOf(term: SolarTermEvent): number {
  switch (term.name) {
    case SolarTermName.LiChun:
      return 0;
    case SolarTermName.JingZhe:
      return 1;
    case SolarTermName.QingMing:
      return 2;
    case SolarTermName.LiXia:
      return 3;
    case SolarTermName.MangZhong:
      return 4;
    case SolarTermName.XiaoShu:
      return 5;
    case SolarTermName.LiQiu:
      return 6;
    case SolarTermName.BaiLu:
      return 7;
    case SolarTermName.HanLu:
      return 8;
    case SolarTermName.LiDong:
      return 9;
    case SolarTermName.DaXue:
      return 10;
    case SolarTermName.XiaoHan:
      return 11;
    default:
      return -1;
  }
}

// ============================================================
// 内部辅助
// ============================================================

function createResolvedGanzhiPillar(stemIndex: number, branchIndex: number): ResolvedGanzhiPillar {
  const normalizedStemIndex = modulo(stemIndex, 10);
  const normalizedBranchIndex = modulo(branchIndex, 12);
  const stem = HEAVENLY_STEMS[normalizedStemIndex]!;
  const branch = EARTHLY_BRANCHES[normalizedBranchIndex]!;

  return {
    stemIndex: normalizedStemIndex,
    branchIndex: normalizedBranchIndex,
    pillar: {
      stem,
      branch,
      name: `${stem}${branch}`
    }
  };
}

/**
 * 在给定时刻之前找到满足条件的最近节气。
 *
 * @param instant 查询时刻。
 * @param solarTerms 节气事件列表。
 * @param predicate 筛选条件。
 * @returns 满足条件的最近节气事件。
 * @throws {RangeError} 当无法找到满足条件的节气时抛出。
 */
function findLatestSolarTerm(
  instant: Instant,
  solarTerms: readonly SolarTermEvent[],
  predicate: (term: SolarTermEvent) => boolean
): SolarTermEvent {
  const instantMilliseconds = toUtcMilliseconds(instant);

  for (let index = solarTerms.length - 1; index >= 0; index -= 1) {
    const term = solarTerms[index]!;

    if (predicate(term) && toUtcMilliseconds(term.instant) <= instantMilliseconds) {
      return term;
    }
  }

  throw new RangeError("Unable to resolve the required solar-term boundary.");
}
