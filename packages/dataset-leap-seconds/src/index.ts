import { TemporalError, type LeapSecondProvider, type UtcDateTime } from "@epheon/temporal";
import { LEAP_SECOND_ENTRIES } from "./internal/leap-second-data";

/** 数据快照的最小元信息。 */
export type DatasetInfo = {
  /** 快照标识，用于追踪来源与更新时间。 */
  readonly id: string;
  /** 数据来源说明。 */
  readonly source: readonly string[];
  /** 快照生成时间，使用 UTC ISO 8601。 */
  readonly generatedAt: string;
  /** 覆盖起点，使用 UTC ISO 8601。 */
  readonly coverageStart: string;
  /** 覆盖终点，使用 UTC ISO 8601。 */
  readonly coverageEnd: string;
  /** 建议的数据刷新节奏。 */
  readonly updateCadence: string;
};

/** 当前闰秒快照的公开元信息。 */
export const leapSecondDatasetInfo: DatasetInfo = {
  id: "leap-seconds-historical-v1",
  source: [
    "IERS Bulletin C historical leap-second announcements.",
    "Normalized into a static TAI-UTC step table."
  ],
  generatedAt: "2026-06-15T00:00:00Z",
  coverageStart: "1972-01-01T00:00:00Z",
  // ponytail: provisional horizon so later packages can run before a fetch task tightens Bulletin C coverage.
  coverageEnd: "2100-01-01T00:00:00Z",
  updateCadence: "Refresh after each published Bulletin C."
};

/**
 * 创建基于内置快照的闰秒 provider。
 *
 * @returns 可注入到 `InstantOptions.leapSeconds` 的 provider。
 */
export function createLeapSecondProvider(): LeapSecondProvider {
  const coverageStart = Date.parse(leapSecondDatasetInfo.coverageStart);
  const coverageEnd = Date.parse(leapSecondDatasetInfo.coverageEnd);
  const entries = LEAP_SECOND_ENTRIES.map((entry) => ({
    ...entry,
    effectiveAtMs: Date.parse(entry.effectiveAt)
  }));

  return (input) => {
    const inputMs = toUtcMilliseconds(input);

    if (inputMs < coverageStart || inputMs >= coverageEnd) {
      throw new TemporalError(
        "InvalidTimeScaleInput",
        "Leap-second dataset does not cover the requested UTC instant."
      );
    }

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];

      if (entry !== undefined && inputMs >= entry.effectiveAtMs) {
        return entry.taiMinusUtcSeconds;
      }
    }

    throw new TemporalError(
      "InvalidTimeScaleInput",
      "Leap-second dataset does not cover the requested UTC instant."
    );
  };
}

/**
 * 将公开的 UTC 输入边界值对象换算成 UTC 毫秒时间戳。
 *
 * @param input 带显式 offset 的 UTC 输入边界值对象。
 * @returns 对应物理时刻的 UTC 毫秒时间戳。
 */
function toUtcMilliseconds(input: UtcDateTime): number {
  const fields = input.toFields();

  return (
    Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second) -
    fields.offsetMinutes * 60_000
  );
}
