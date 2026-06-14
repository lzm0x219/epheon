import { TemporalError } from "../errors";
import { UtcDateTime, type UtcDateTimeFields } from "../utc-date-time";

/** 第一阶段只接受带显式 UTC offset 的 ISO-like 日期时间字符串。 */
const ISO_OFFSET_PATTERN =
  /^([+-]?\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)(Z|[+-]\d{2}:\d{2})$/u;

/**
 * 读取正则捕获组；缺失表示解析器内部模式与字段索引不一致。
 *
 * @param match 正则匹配结果。
 * @param index 捕获组索引。
 * @param name 捕获组名称，用于错误消息。
 * @returns 捕获组字符串。
 * @throws TemporalError 当捕获组缺失时抛出。
 */
function requireMatchGroup(match: RegExpExecArray, index: number, name: string): string {
  const value = match[index];

  if (value === undefined) {
    throw new TemporalError("InvalidUTCDateTime", `Missing ${name}.`);
  }

  return value;
}

/**
 * 将 Z 或 ±HH:mm offset 转换为分钟数。
 *
 * @param offset UTC offset 字符串。
 * @returns offset 对应的分钟数，东区为正，西区为负。
 * @throws TemporalError 当 offset 小时或分钟超出范围时抛出。
 */
function parseOffsetMinutes(offset: string): number {
  if (offset === "Z") {
    return 0;
  }

  const sign = offset.startsWith("-") ? -1 : 1;
  const hours = Number(offset.slice(1, 3));
  const minutes = Number(offset.slice(4, 6));

  if (hours > 23 || minutes > 59) {
    throw new TemporalError("InvalidUTCDateTime", "UTC offset is out of range.");
  }

  return sign * (hours * 60 + minutes);
}

/**
 * 解析显式 offset 的 UTC 字符串，并校验 Gregorian 日期时间有效性。
 *
 * @param input 带 `Z` 或 `±HH:mm` offset 的 UTC-like 字符串。
 * @returns 解析后的 UTC 输入边界值对象。
 * @throws TemporalError 当 input 格式不符合第一阶段要求或日期时间字段超出范围时抛出。
 */
export function parseUTCDateTime(input: string): UtcDateTime {
  const match = ISO_OFFSET_PATTERN.exec(input);

  if (match === null) {
    throw new TemporalError(
      "InvalidUTCDateTime",
      "UTC input must include date, time, seconds, and an explicit offset."
    );
  }

  const fields: UtcDateTimeFields = {
    year: Number(requireMatchGroup(match, 1, "year")),
    month: Number(requireMatchGroup(match, 2, "month")),
    day: Number(requireMatchGroup(match, 3, "day")),
    hour: Number(requireMatchGroup(match, 4, "hour")),
    minute: Number(requireMatchGroup(match, 5, "minute")),
    second: Number(requireMatchGroup(match, 6, "second")),
    offsetMinutes: parseOffsetMinutes(requireMatchGroup(match, 7, "offset"))
  };

  return UtcDateTime.fromFields(fields);
}
