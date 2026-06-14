/** 解析后的 UTC 日期时间字段，offsetMinutes 表示输入字符串携带的显式 UTC 偏移。 */
export type UtcDateTimeFields = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly offsetMinutes: number;
};
