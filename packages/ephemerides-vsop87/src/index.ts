/** VSOP87 太阳 provider 的公共入口；完整行星支持留到后续阶段。 */
export {
  createVSOP87SunProvider,
  solarEclipticLongitude,
  solarEclipticPosition
} from "./sun-provider";
export type { SolarPositionInput } from "./sun-provider";
