import { bench, describe } from "vitest";
import { lunarMonthTableOfYear } from "../packages/calendar-chinese/src";
import { createDeltaTProvider } from "../packages/dataset-delta-t/src";
import { createLeapSecondProvider } from "../packages/dataset-leap-seconds/src";
import { createELP2000MoonProvider } from "../packages/ephemerides-elp2000/src";
import { createVSOP87SunProvider } from "../packages/ephemerides-vsop87/src";
import { type EphemerisOptions } from "../packages/ephemerides/src";
import {
  type PhenomenaContext,
  findLunarPhaseBetween,
  LunarPhaseKind,
  solarTermsOfYear
} from "../packages/phenomena/src";
import { Body, type Position } from "../packages/reference/src";
import { Instant } from "../packages/temporal/src";

/**
 * 共享的求解上下文，全局初始化一次。
 */
const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();
const sunProvider = createVSOP87SunProvider();
const moonProvider = createELP2000MoonProvider();
const context: PhenomenaContext = {
  ephemeris: {
    position(body: Body, instant: Instant, options?: EphemerisOptions): Position {
      return body === Body.Sun
        ? sunProvider.position(body, instant, options)
        : moonProvider.position(body, instant, options);
    }
  },
  leapSeconds,
  deltaT
};

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

/**
 * 收集指定 UTC 年份内所有朔时刻。
 */
function newMoonsOfYear(year: number, ctx: PhenomenaContext): readonly Instant[] {
  const results: Instant[] = [];
  const yearStartMs = Date.UTC(year, 0, 1);
  const yearEndMs = Date.UTC(year + 1, 0, 1);
  // 从年初往前推 40 天开始扫描，确保捕获年初的朔
  const scanStartMs = yearStartMs - 40 * DAY_MILLISECONDS;

  let cursorMs = scanStartMs;
  while (cursorMs < yearEndMs) {
    const start = Instant.fromUTC(new Date(cursorMs).toISOString(), {
      leapSeconds: ctx.leapSeconds,
      deltaT: ctx.deltaT
    });
    const end = Instant.fromUTC(new Date(cursorMs + 35 * DAY_MILLISECONDS).toISOString(), {
      leapSeconds: ctx.leapSeconds,
      deltaT: ctx.deltaT
    });
    const phase = findLunarPhaseBetween(LunarPhaseKind.NewMoon, start, end, ctx);
    const ms = toUtcMilliseconds(phase.instant);

    if (ms >= yearStartMs && ms < yearEndMs) {
      results.push(phase.instant);
    }
    cursorMs = ms + DAY_MILLISECONDS;
  }

  return results;
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

describe("benchmark: 年度节气求解", () => {
  bench("solarTermsOfYear(2023)", () => {
    solarTermsOfYear(2023, context);
  });

  bench("solarTermsOfYear(2024)", () => {
    solarTermsOfYear(2024, context);
  });

  bench("solarTermsOfYear(2025)", () => {
    solarTermsOfYear(2025, context);
  });
});

describe("benchmark: 年度朔望扫描", () => {
  bench("newMoonsOfYear(2023)", () => {
    newMoonsOfYear(2023, context);
  });

  bench("newMoonsOfYear(2024)", () => {
    newMoonsOfYear(2024, context);
  });

  bench("newMoonsOfYear(2025)", () => {
    newMoonsOfYear(2025, context);
  });
});

describe("benchmark: 年度农历月表", () => {
  bench("lunarMonthTableOfYear(2023)", () => {
    lunarMonthTableOfYear(2023, context);
  });

  bench("lunarMonthTableOfYear(2024)", () => {
    lunarMonthTableOfYear(2024, context);
  });

  bench("lunarMonthTableOfYear(2025)", () => {
    lunarMonthTableOfYear(2025, context);
  });
});
