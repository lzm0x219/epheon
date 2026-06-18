import { Instant } from "@epheon/temporal";
import type { PhenomenaContext } from "../solar-terms";

/**
 * 从 UTC 毫秒时间戳构造可参与天象求解的 Instant。
 *
 * @param milliseconds UTC 毫秒时间戳。
 * @param context 求解上下文。
 * @returns 新的 Instant 值对象。
 */
export function createInstantFromUtcMilliseconds(
  milliseconds: number,
  context: PhenomenaContext
): Instant {
  return Instant.fromUTC(new Date(milliseconds).toISOString(), {
    leapSeconds: context.leapSeconds,
    deltaT: context.deltaT
  });
}

/**
 * 把 Instant 换算成 UTC 毫秒时间戳。
 *
 * @param instant 要换算的时刻。
 * @returns 对应物理时刻的 UTC 毫秒时间戳。
 */
export function toUtcMilliseconds(instant: Instant): number {
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

/**
 * 把角度差归一化到 [-180, 180)。
 *
 * @param degrees 任意角度差。
 * @returns 归一化后的角度差。
 */
export function normalizeSignedDegrees(degrees: number): number {
  const normalized = (((degrees + 180) % 360) + 360) % 360;

  return normalized - 180;
}

/**
 * 判断两个事件函数值是否包围了同一个根。
 *
 * @param left 左端点值。
 * @param right 右端点值。
 * @returns 两端同号时返回 false，变号或命中零时返回 true。
 */
export function isBracket(left: number, right: number): boolean {
  return left === 0 || right === 0 || (left < 0 && right > 0) || (left > 0 && right < 0);
}
