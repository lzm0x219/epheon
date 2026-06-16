/** 可请求的天体标识。 */
export const Body = {
  Sun: "SUN",
  Moon: "MOON",
  Mercury: "MERCURY",
  Venus: "VENUS",
  Earth: "EARTH",
  Mars: "MARS",
  Jupiter: "JUPITER",
  Saturn: "SATURN",
  Uranus: "URANUS",
  Neptune: "NEPTUNE"
} as const;

/** 天体标识的字符串字面量联合。 */
export type Body = (typeof Body)[keyof typeof Body];
