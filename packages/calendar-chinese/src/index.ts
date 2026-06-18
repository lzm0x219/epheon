import { Instant } from "@epheon/temporal";

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

function assertStrictlyIncreasing(values: readonly number[], label: string): void {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index]! <= values[index - 1]!) {
      throw new RangeError(`${label} must be strictly increasing.`);
    }
  }
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
