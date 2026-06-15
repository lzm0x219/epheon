/**
 * 使用 Horner 法计算多项式在给定点的值。
 *
 * 系数从低次到高次排列：f(x) = c₀ + c₁·x + c₂·x² + … + cₙ·xⁿ
 *
 * @param coefficients 系数数组，索引 i 对应 xⁱ 的系数。
 * @param x 求值点。
 * @returns 多项式值。空系数数组返回 0。
 */
export function evaluatePolynomial(coefficients: readonly number[], x: number): number {
  // reduceRight 从高次到低次迭代，天然实现 Horner 法：((cₙ·x + cₙ₋₁)·x + …) + c₀
  return coefficients.reduceRight((result, c) => result * x + c, 0);
}
