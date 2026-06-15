import type { UtcDateTimeFields } from "../utc-date-time";
import { TemporalError } from "../errors";
import { SECONDS_PER_DAY } from "./constants";

/**
 * 判断 proleptic Gregorian calendar 下某一年是否为闰年。
 *
 * @param year Gregorian 年份。
 * @returns 该年份是闰年时返回 true。
 */
export function isGregorianLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

/**
 * 返回 proleptic Gregorian calendar 下指定月份的天数。
 *
 * @param year Gregorian 年份。
 * @param month Gregorian 月份，范围应为 1-12。
 * @returns 指定月份的天数。
 */
export function daysInGregorianMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isGregorianLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

/**
 * 校验 UTC 字段是否构成有效的 Gregorian 日期时间。
 *
 * @param fields 解析得到的 UTC 日期时间字段。
 * @returns 校验通过时不返回值。
 * @throws TemporalError 当月份、日期、时分秒超出 Gregorian 合法范围时抛出。
 */
export function assertGregorianDateTime(fields: UtcDateTimeFields): void {
  if (fields.month < 1 || fields.month > 12) {
    throw new TemporalError("InvalidUTCDateTime", "month is out of range.");
  }

  if (fields.day < 1 || fields.day > 31) {
    throw new TemporalError("InvalidUTCDateTime", "day is out of range.");
  }

  if (fields.day > daysInGregorianMonth(fields.year, fields.month)) {
    throw new TemporalError("InvalidUTCDateTime", "day is out of range for month.");
  }

  if (fields.hour < 0 || fields.hour > 23) {
    throw new TemporalError("InvalidUTCDateTime", "hour is out of range.");
  }

  if (fields.minute < 0 || fields.minute > 59) {
    throw new TemporalError("InvalidUTCDateTime", "minute is out of range.");
  }

  if (fields.second < 0 || fields.second >= 60) {
    throw new TemporalError("InvalidUTCDateTime", "second is out of range.");
  }
}

/**
 * 将 Gregorian 日期时间转换为 Julian Day。
 *
 * 这里使用标准 Gregorian 修正项，输入仍保留原始 offset 语义；调用方负责在
 * 得到本地 Julian Day 后减去 offset 对应的日数。
 *
 * @param fields 已校验的 Gregorian 日期时间字段。
 * @returns 输入字段对应的本地 Julian Day 数值。
 */
export function gregorianToJulianDay(fields: UtcDateTimeFields): number {
  let year = fields.year;
  let month = fields.month;

  // Julian Day 公式把 1 月和 2 月视为上一年的第 13、14 月。
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const century = Math.floor(year / 100);
  const gregorianCorrection = 2 - century + Math.floor(century / 4);
  const dayFraction = (fields.hour * 3600 + fields.minute * 60 + fields.second) / SECONDS_PER_DAY;

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    fields.day +
    dayFraction +
    gregorianCorrection -
    1524.5
  );
}
