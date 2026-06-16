/**
 * 星历 provider 可声明的精度等级。
 *
 * `Precision` 表达 provider 能力要求，不绑定固定误差数值。
 */
export const Precision = {
  FastLow: "FAST_LOW",
  Standard: "STANDARD",
  High: "HIGH"
} as const;

/** 星历精度等级的字符串字面量联合。 */
export type Precision = (typeof Precision)[keyof typeof Precision];
