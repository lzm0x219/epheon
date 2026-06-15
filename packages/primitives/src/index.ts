/** primitives 包公共 API 入口；不要从这里导出 src/internal 下的实现细节。 */
export { Angle } from "./angle";
export { Duration } from "./duration";
export { PrimitiveError } from "./errors";
export type { PrimitiveErrorCode } from "./errors";
export type { Err, Ok, Result } from "./result";
export { err, isErr, isOk, ok } from "./result";
export type { Tolerance } from "./tolerance";
export { almostEqual } from "./tolerance";
export { Vector3 } from "./vector3";
