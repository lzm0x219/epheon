/** 表示成功结果，携带计算出的值。 */
export type Ok<T> = {
  readonly ok: true;
  readonly value: T;
};

/** 表示失败结果，携带结构化错误。 */
export type Err<E> = {
  readonly ok: false;
  readonly error: E;
};

/** 用于可恢复错误的返回类型，避免解析类 API 只能依赖异常控制流。 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * 创建成功结果。
 *
 * @param value 成功分支携带的值。
 * @returns ok 为 true 的 Result。
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * 创建失败结果。
 *
 * @param error 失败分支携带的错误。
 * @returns ok 为 false 的 Result。
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * 判断 Result 是否为成功分支，并帮助 TypeScript 缩窄类型。
 *
 * @param result 要判断的 Result。
 * @returns result 为 Ok 分支时返回 true。
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

/**
 * 判断 Result 是否为失败分支，并帮助 TypeScript 缩窄类型。
 *
 * @param result 要判断的 Result。
 * @returns result 为 Err 分支时返回 true。
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}
