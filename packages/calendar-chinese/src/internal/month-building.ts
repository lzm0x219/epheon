import { solarTermsOfYear, type PhenomenaContext } from "@epheon/phenomena";
import { Instant } from "@epheon/temporal";
import type { ChineseLunarMonth } from "../index";
import {
  collectNewMoonStarts,
  isPrincipalTermLongitude,
  nextMonthNumber,
  previousMonthNumber,
  toLocalYear,
  toUtcMilliseconds
} from "./helpers";

/** 中气标记（包含是否冬至的布尔标记）。 */
export type PrincipalTermMarker = {
  readonly instant: Instant;
  readonly isWinterSolstice: boolean;
};

/** 已解析年月编号的农历月段（内部类型）。 */
export type ResolvedChineseLunarMonth = ChineseLunarMonth & {
  readonly year: number;
  readonly month: number;
};

/**
 * 构建并解析农历月表：自动拼接朔与中气，返回带年月编号的结果。
 *
 * @param startMilliseconds 搜索窗口起点（UTC 毫秒）。
 * @param endMilliseconds 搜索窗口终点（UTC 毫秒）。
 * @param referenceInstant 用于确定 offset 的参考时刻。
 * @param context 天象求解上下文。
 * @returns 解析后的农历月条目列表。
 */
export function buildResolvedChineseLunarMonths(
  startMilliseconds: number,
  endMilliseconds: number,
  referenceInstant: Instant,
  context: PhenomenaContext
): readonly ResolvedChineseLunarMonth[] {
  const principalTerms = collectPrincipalTerms(startMilliseconds, endMilliseconds, context);
  const newMoonStarts = collectNewMoonStarts(startMilliseconds, endMilliseconds, context);

  return resolveChineseLunarMonths(
    buildChineseLunarMonthTable(newMoonStarts, principalTerms),
    referenceInstant,
    context
  );
}

/**
 * 收集中气时刻（限定时间窗内）。
 *
 * @param startMilliseconds 搜索窗口起点。
 * @param endMilliseconds 搜索窗口终点。
 * @param context 天象求解上下文。
 * @returns 中气标记列表。
 */
export function collectPrincipalTerms(
  startMilliseconds: number,
  endMilliseconds: number,
  context: PhenomenaContext
): readonly PrincipalTermMarker[] {
  const startYear = new Date(startMilliseconds).getUTCFullYear();
  const endYear = new Date(endMilliseconds).getUTCFullYear();
  const principalTerms: PrincipalTermMarker[] = [];

  for (let year = startYear; year <= endYear; year += 1) {
    const terms = solarTermsOfYear(year, context);

    for (const term of terms) {
      const targetLongitudeDegrees = term.targetLongitude.normalizeDegrees().toDegrees();
      const termMilliseconds = toUtcMilliseconds(term.instant);

      if (
        isPrincipalTermLongitude(targetLongitudeDegrees) &&
        termMilliseconds >= startMilliseconds &&
        termMilliseconds < endMilliseconds
      ) {
        principalTerms.push({
          instant: term.instant,
          isWinterSolstice: term.name === "冬至"
        });
      }
    }
  }

  return principalTerms;
}

/**
 * 使用冬至极值修正闰月判定，构建完整的农历月序列。
 *
 * @param newMoonStarts 朔时刻列表。
 * @param principalTerms 中气标记列表。
 * @returns 含修正闰月标记的月段列表。
 */
export function buildChineseLunarMonthTable(
  newMoonStarts: readonly Instant[],
  principalTerms: readonly PrincipalTermMarker[]
): readonly ChineseLunarMonth[] {
  const months = buildLunarMonthSequenceInternal(
    newMoonStarts,
    principalTerms.map((term) => term.instant)
  );
  const leapMonthFlags = Array<boolean>(months.length).fill(false);
  const winterSolsticeAnchors = principalTerms
    .filter((term) => term.isWinterSolstice)
    .map((term) =>
      months.findIndex((month) => {
        const monthStartMilliseconds = toUtcMilliseconds(month.start);
        const monthEndMilliseconds = toUtcMilliseconds(month.end);
        const termMilliseconds = toUtcMilliseconds(term.instant);

        return (
          termMilliseconds >= monthStartMilliseconds && termMilliseconds < monthEndMilliseconds
        );
      })
    )
    .filter((index) => index >= 0);

  for (let index = 0; index < winterSolsticeAnchors.length - 1; index += 1) {
    const anchor = winterSolsticeAnchors[index]!;
    const nextAnchor = winterSolsticeAnchors[index + 1]!;

    if (nextAnchor - anchor !== 13) {
      continue;
    }

    const leapMonthIndex = months.findIndex(
      (month, monthIndex) =>
        monthIndex >= anchor && monthIndex < nextAnchor && !month.containsPrincipalTerm
    );

    if (leapMonthIndex >= 0) {
      leapMonthFlags[leapMonthIndex] = true;
    }
  }

  return months.map((month, index) => ({
    ...month,
    isLeapMonth: leapMonthFlags[index]!
  }));
}

/**
 * 为农历月段分配农历年月编号。
 *
 * @param months 按顺序排列的农历月段。
 * @param referenceInstant 用于确定 offset 的参考时刻。
 * @param context 天象求解上下文。
 * @returns 带年月编号的解析月列表。
 */
export function resolveChineseLunarMonths(
  months: readonly ChineseLunarMonth[],
  referenceInstant: Instant,
  context: PhenomenaContext
): readonly ResolvedChineseLunarMonth[] {
  const numberedMonths = assignLunarMonthNumbers(months, context);
  const monthOneIndices = numberedMonths.flatMap((month, index) =>
    !month.isLeapMonth && month.month === 1 ? [index] : []
  );

  if (monthOneIndices.length === 0) {
    throw new RangeError("Unable to resolve lunar year anchors from the generated month table.");
  }

  const offsetMinutes = referenceInstant.toUTCFields().offsetMinutes;
  const firstMonthOneYear = toLocalYear(numberedMonths[monthOneIndices[0]!]!.start, offsetMinutes);
  const resolved = numberedMonths.map((month) => ({
    ...month,
    year: firstMonthOneYear - 1
  }));

  for (let index = 0; index < monthOneIndices.length; index += 1) {
    const segmentStart = monthOneIndices[index]!;
    const segmentEnd = monthOneIndices[index + 1] ?? resolved.length;
    const lunarYear = toLocalYear(resolved[segmentStart]!.start, offsetMinutes);

    for (let monthIndex = segmentStart; monthIndex < segmentEnd; monthIndex += 1) {
      resolved[monthIndex] = {
        ...resolved[monthIndex]!,
        year: lunarYear
      };
    }
  }

  return resolved;
}

// ============================================================
// 内部辅助：月编号与冬至锚点
// ============================================================

function assignLunarMonthNumbers(
  months: readonly ChineseLunarMonth[],
  context: PhenomenaContext
): readonly Omit<ResolvedChineseLunarMonth, "year">[] {
  const monthNumbers = Array<number>(months.length).fill(0);
  const winterSolsticeAnchors = collectWinterSolsticeAnchors(months, context);

  if (winterSolsticeAnchors.length === 0) {
    throw new RangeError("Unable to locate a winter-solstice anchor for lunar month numbering.");
  }

  for (const anchorIndex of winterSolsticeAnchors) {
    monthNumbers[anchorIndex] = 11;
  }

  fillMonthNumbersBackward(months, monthNumbers, winterSolsticeAnchors[0]!);

  for (let index = 0; index < winterSolsticeAnchors.length - 1; index += 1) {
    fillMonthNumbersForward(
      months,
      monthNumbers,
      winterSolsticeAnchors[index]!,
      winterSolsticeAnchors[index + 1]!
    );
  }

  fillMonthNumbersForward(
    months,
    monthNumbers,
    winterSolsticeAnchors[winterSolsticeAnchors.length - 1]!,
    months.length
  );

  return months.map((month, index) => ({
    ...month,
    month: monthNumbers[index]!
  }));
}

function collectWinterSolsticeAnchors(
  months: readonly ChineseLunarMonth[],
  context: PhenomenaContext
): readonly number[] {
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];

  if (firstMonth === undefined || lastMonth === undefined) {
    return [];
  }

  const startMilliseconds = toUtcMilliseconds(firstMonth.start);
  const endMilliseconds = toUtcMilliseconds(lastMonth.end);
  const startYear = new Date(startMilliseconds).getUTCFullYear();
  const endYear = new Date(endMilliseconds).getUTCFullYear();
  const anchors = new Set<number>();

  for (let year = startYear; year <= endYear; year += 1) {
    const winterSolstice = solarTermsOfYear(year, context).find((term) => term.name === "冬至");

    if (winterSolstice === undefined) {
      continue;
    }

    const anchorIndex = months.findIndex((month) => {
      const monthStartMilliseconds = toUtcMilliseconds(month.start);
      const monthEndMilliseconds = toUtcMilliseconds(month.end);
      const solsticeMilliseconds = toUtcMilliseconds(winterSolstice.instant);

      return (
        solsticeMilliseconds >= monthStartMilliseconds &&
        solsticeMilliseconds < monthEndMilliseconds
      );
    });

    if (anchorIndex >= 0) {
      anchors.add(anchorIndex);
    }
  }

  return Array.from(anchors).sort((left, right) => left - right);
}

function fillMonthNumbersForward(
  months: readonly ChineseLunarMonth[],
  monthNumbers: number[],
  startIndex: number,
  endExclusive: number
): void {
  for (let index = startIndex + 1; index < endExclusive; index += 1) {
    const previousMonthNumber = monthNumbers[index - 1]!;

    monthNumbers[index] = months[index]!.isLeapMonth
      ? previousMonthNumber
      : nextMonthNumber(previousMonthNumber);
  }
}

function fillMonthNumbersBackward(
  months: readonly ChineseLunarMonth[],
  monthNumbers: number[],
  anchorIndex: number
): void {
  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    const nextMonth = months[index + 1]!;
    const nextMonthNumber = monthNumbers[index + 1]!;

    monthNumbers[index] = nextMonth.isLeapMonth
      ? nextMonthNumber
      : previousMonthNumber(nextMonthNumber);
  }
}

/**
 * 根据朔和中气的内联实现（供内部月表构建使用，等同于公共 buildLunarMonthSequence）。
 *
 * @param newMoonStarts 连续朔时刻。
 * @param principalTerms 中气时刻。
 * @returns 月段序列。
 */
function buildLunarMonthSequenceInternal(
  newMoonStarts: readonly Instant[],
  principalTerms: readonly Instant[]
): readonly ChineseLunarMonth[] {
  if (newMoonStarts.length < 2) {
    return [];
  }

  const newMoonStartTimes = newMoonStarts.map(toUtcMilliseconds);
  const principalTermTimes = principalTerms.map(toUtcMilliseconds);

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
