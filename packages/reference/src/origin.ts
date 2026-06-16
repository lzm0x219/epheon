/** 坐标原点。 */
export const Origin = {
  Heliocentric: "HELIOCENTRIC",
  Geocentric: "GEOCENTRIC"
} as const;

/** 坐标原点的字符串字面量联合。 */
export type Origin = (typeof Origin)[keyof typeof Origin];
