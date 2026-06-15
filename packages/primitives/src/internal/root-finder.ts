import { PrimitiveError } from "../errors";

/**
 * 使用二分法在区间 [left, right] 上查找方程 f(x) = target 的根。
 *
 * 要求 f(left) − target 与 f(right) − target 异号（bracket 条件），
 * 否则无法保证区间内存在根。
 *
 * @param f 单调连续函数。
 * @param target 目标函数值。
 * @param left 区间左端点。
 * @param right 区间右端点。
 * @param options.tolerance 收敛容差，默认 1e-10。
 * @param options.maxIterations 最大迭代次数，默认 100。
 * @returns 满足 |f(x) − target| 在 tolerance 内的近似根。
 * @throws PrimitiveError(DivisionByZero) 当 bracket 条件不满足时抛出。
 * @throws Error 当超过 maxIterations 仍未收敛时抛出。
 */
export function bisect(
  f: (x: number) => number,
  target: number,
  left: number,
  right: number,
  options?: {
    tolerance?: number;
    maxIterations?: number;
  }
): number {
  const tolerance = options?.tolerance ?? 1e-10;
  const maxIterations = options?.maxIterations ?? 100;

  let a = left;
  let b = right;
  let fA = f(a) - target;
  let fB = f(b) - target;

  // 端点残差必须异号，否则区间内不一定有根
  if (fA * fB >= 0) {
    throw new PrimitiveError(
      "DivisionByZero",
      `Root must be bracketed: f(${a}) = ${fA + target}, f(${b}) = ${fB + target}, residuals have the same sign.`
    );
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = (a + b) / 2;
    const fMid = f(mid) - target;
    const halfWidth = (b - a) / 2;

    // 精确命中或区间宽度收敛
    if (fMid === 0 || halfWidth < tolerance) {
      return mid;
    }

    // 根在 [mid, b] 中（fMid 与 fA 同号则替换左端点，否则替换右端点）
    if (fMid * fA > 0) {
      a = mid;
      fA = fMid;
    } else {
      b = mid;
      fB = fMid;
    }
  }

  throw new Error(
    `bisect: did not converge within ${maxIterations} iterations in [${left}, ${right}].`
  );
}
