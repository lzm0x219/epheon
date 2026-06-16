/** ephemerides 包公共 API 入口；具体算法实现保留在实现包中。 */
export { EphemerisError, toEphemerisError } from "./errors";
export type { EphemerisErrorCode } from "./errors";
export type { EphemerisOptions, EphemerisProvider } from "./ephemeris-provider";
export { resolveEphemerisOptions } from "./ephemeris-provider";
export { Precision } from "./precision";
export type { Precision as EphemerisPrecision } from "./precision";
