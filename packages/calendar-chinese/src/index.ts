import {
  findLunarPhaseBetween,
  LunarPhaseKind,
  solarTermsOfYear,
  type PhenomenaContext
} from "@epheon/phenomena";
import { Body, ReferenceFrame } from "@epheon/reference";
import { Instant } from "@epheon/temporal";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const SEARCH_PADDING_MILLISECONDS = 35 * DAY_IN_MILLISECONDS;
const NEW_MOON_WINDOW_MILLISECONDS = 32 * DAY_IN_MILLISECONDS;
const DATE_QUERY_WINDOW_MILLISECONDS = 400 * DAY_IN_MILLISECONDS;
const NEW_MOON_SCAN_STEP_MILLISECONDS = 6 * 60 * 60 * 1000;

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

type ResolvedChineseLunarMonth = ChineseLunarMonthTableEntry & {
  readonly month: number;
  readonly lunarYear: number;
};

type PrincipalTermMarker = {
  readonly instant: Instant;
  readonly isWinterSolstice: boolean;
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

  return buildChineseLunarMonthTable(newMoonStarts, principalTerms)
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
  const months = resolveChineseLunarMonths(
    createInstantFromUtcMilliseconds(instantMilliseconds - DATE_QUERY_WINDOW_MILLISECONDS, context),
    createInstantFromUtcMilliseconds(instantMilliseconds + DATE_QUERY_WINDOW_MILLISECONDS, context),
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
    year: currentMonth.lunarYear,
    month: currentMonth.month,
    day:
      toLocalDaySerial(instant, offsetMinutes) -
      toLocalDaySerial(currentMonth.start, offsetMinutes) +
      1,
    isLeapMonth: currentMonth.isLeapMonth
  };
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

function collectNewMoonStarts(
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

function resolveChineseLunarMonths(
  start: Instant,
  end: Instant,
  referenceInstant: Instant,
  context: PhenomenaContext
): readonly ResolvedChineseLunarMonth[] {
  const months = lunarMonthTableBetween(start, end, context);
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
    lunarYear: firstMonthOneYear - 1
  }));

  for (let index = 0; index < monthOneIndices.length; index += 1) {
    const segmentStart = monthOneIndices[index]!;
    const segmentEnd = monthOneIndices[index + 1] ?? resolved.length;
    const lunarYear = toLocalYear(resolved[segmentStart]!.start, offsetMinutes);

    for (let monthIndex = segmentStart; monthIndex < segmentEnd; monthIndex += 1) {
      resolved[monthIndex] = {
        ...resolved[monthIndex]!,
        lunarYear
      };
    }
  }

  return resolved;
}

function buildChineseLunarMonthTable(
  newMoonStarts: readonly Instant[],
  principalTerms: readonly PrincipalTermMarker[]
): readonly ChineseLunarMonth[] {
  const months = buildLunarMonthSequence(
    newMoonStarts,
    principalTerms.map((term) => term.instant)
  );
  const leapMonthFlags = Array(months.length).fill(false);
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

function assignLunarMonthNumbers(
  months: readonly ChineseLunarMonthTableEntry[],
  context: PhenomenaContext
): readonly Omit<ResolvedChineseLunarMonth, "lunarYear">[] {
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
  months: readonly ChineseLunarMonthTableEntry[],
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
  months: readonly ChineseLunarMonthTableEntry[],
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
  months: readonly ChineseLunarMonthTableEntry[],
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

function nextMonthNumber(monthNumber: number): number {
  return monthNumber === 12 ? 1 : monthNumber + 1;
}

function previousMonthNumber(monthNumber: number): number {
  return monthNumber === 1 ? 12 : monthNumber - 1;
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

function toLocalDaySerial(instant: Instant, offsetMinutes: number): number {
  return Math.floor((toUtcMilliseconds(instant) + offsetMinutes * 60_000) / DAY_IN_MILLISECONDS);
}

function toLocalYear(instant: Instant, offsetMinutes: number): number {
  return new Date(toUtcMilliseconds(instant) + offsetMinutes * 60_000).getUTCFullYear();
}

function lunarElongationDegrees(instant: Instant, context: PhenomenaContext): number {
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

function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

function isPrincipalTermLongitude(longitudeDegrees: number): boolean {
  const remainder = normalizeDegrees(longitudeDegrees) % 30;

  return remainder < 1e-9 || 30 - remainder < 1e-9;
}
