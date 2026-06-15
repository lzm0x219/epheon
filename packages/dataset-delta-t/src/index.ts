import { Duration } from "@epheon/primitives";
import { TemporalError, type DeltaTProvider, type Instant } from "@epheon/temporal";
import { DELTA_T_SEGMENTS } from "./internal/delta-t-data";

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

/** 当前 Delta-T 快照的公开元信息。 */
export const deltaTDatasetInfo: DatasetInfo = {
  id: "delta-t-polynomial-v1",
  source: [
    "Espenak and Meeus polynomial Delta-T approximations.",
    "Suitable for initial ephemeris and calendar calculations inside the declared coverage."
  ],
  generatedAt: "2026-06-15T00:00:00Z",
  coverageStart: "1600-01-01T00:00:00Z",
  coverageEnd: "2150-01-01T00:00:00Z",
  updateCadence: "Refresh when model coefficients or source references change."
};

/**
 * 创建基于内置快照的 Delta-T provider。
 *
 * @returns 可注入到 `InstantOptions.deltaT` 的 provider。
 */
export function createDeltaTProvider(): DeltaTProvider {
  const coverageStart = Date.parse(deltaTDatasetInfo.coverageStart);
  const coverageEnd = Date.parse(deltaTDatasetInfo.coverageEnd);

  return (instant) => {
    const utcMilliseconds = instantToUtcMilliseconds(instant);

    if (utcMilliseconds < coverageStart || utcMilliseconds >= coverageEnd) {
      throw new TemporalError(
        "InvalidTimeScaleInput",
        "Delta-T dataset does not cover the requested instant."
      );
    }

    const utcDate = new Date(utcMilliseconds);
    const decimalYear = toDecimalYear(utcDate);

    for (const segment of DELTA_T_SEGMENTS) {
      if (decimalYear >= segment.startYear && decimalYear < segment.endYear) {
        return Duration.fromSeconds(segment.computeSeconds(decimalYear));
      }
    }

    throw new TemporalError(
      "InvalidTimeScaleInput",
      "Delta-T dataset does not cover the requested instant."
    );
  };
}

/**
 * 将 Instant 归一化成 UTC 毫秒时间戳，避免输入 offset 影响结果。
 *
 * @param instant 要估算 Delta-T 的时间点。
 * @returns 对应物理时刻的 UTC 毫秒时间戳。
 */
function instantToUtcMilliseconds(instant: Instant): number {
  const fields = instant.toUTCFields();

  return (
    Date.UTC(fields.year, fields.month - 1, fields.day, fields.hour, fields.minute, fields.second) -
    fields.offsetMinutes * 60_000
  );
}

/**
 * 计算 UTC 时间点对应的十进制年份。
 *
 * @param utcDate 归一化后的 UTC Date。
 * @returns 用于多项式模型的十进制年份。
 */
function toDecimalYear(utcDate: Date): number {
  const year = utcDate.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 1);
  const startOfNextYear = Date.UTC(year + 1, 0, 1);

  return year + (utcDate.getTime() - startOfYear) / (startOfNextYear - startOfYear);
}
