/** 单条闰秒快照记录。 */
export type LeapSecondEntry = {
  /** 新的 TAI-UTC 值生效的 UTC 时刻。 */
  readonly effectiveAt: string;
  /** 该时刻起生效的 TAI-UTC 秒数。 */
  readonly taiMinusUtcSeconds: number;
};

/** 现代 UTC 闰秒制度下的历史快照。 */
export const LEAP_SECOND_ENTRIES: readonly LeapSecondEntry[] = [
  { effectiveAt: "1972-01-01T00:00:00Z", taiMinusUtcSeconds: 10 },
  { effectiveAt: "1972-07-01T00:00:00Z", taiMinusUtcSeconds: 11 },
  { effectiveAt: "1973-01-01T00:00:00Z", taiMinusUtcSeconds: 12 },
  { effectiveAt: "1974-01-01T00:00:00Z", taiMinusUtcSeconds: 13 },
  { effectiveAt: "1975-01-01T00:00:00Z", taiMinusUtcSeconds: 14 },
  { effectiveAt: "1976-01-01T00:00:00Z", taiMinusUtcSeconds: 15 },
  { effectiveAt: "1977-01-01T00:00:00Z", taiMinusUtcSeconds: 16 },
  { effectiveAt: "1978-01-01T00:00:00Z", taiMinusUtcSeconds: 17 },
  { effectiveAt: "1979-01-01T00:00:00Z", taiMinusUtcSeconds: 18 },
  { effectiveAt: "1980-01-01T00:00:00Z", taiMinusUtcSeconds: 19 },
  { effectiveAt: "1981-07-01T00:00:00Z", taiMinusUtcSeconds: 20 },
  { effectiveAt: "1982-07-01T00:00:00Z", taiMinusUtcSeconds: 21 },
  { effectiveAt: "1983-07-01T00:00:00Z", taiMinusUtcSeconds: 22 },
  { effectiveAt: "1985-07-01T00:00:00Z", taiMinusUtcSeconds: 23 },
  { effectiveAt: "1988-01-01T00:00:00Z", taiMinusUtcSeconds: 24 },
  { effectiveAt: "1990-01-01T00:00:00Z", taiMinusUtcSeconds: 25 },
  { effectiveAt: "1991-01-01T00:00:00Z", taiMinusUtcSeconds: 26 },
  { effectiveAt: "1992-07-01T00:00:00Z", taiMinusUtcSeconds: 27 },
  { effectiveAt: "1993-07-01T00:00:00Z", taiMinusUtcSeconds: 28 },
  { effectiveAt: "1994-07-01T00:00:00Z", taiMinusUtcSeconds: 29 },
  { effectiveAt: "1996-01-01T00:00:00Z", taiMinusUtcSeconds: 30 },
  { effectiveAt: "1997-07-01T00:00:00Z", taiMinusUtcSeconds: 31 },
  { effectiveAt: "1999-01-01T00:00:00Z", taiMinusUtcSeconds: 32 },
  { effectiveAt: "2006-01-01T00:00:00Z", taiMinusUtcSeconds: 33 },
  { effectiveAt: "2009-01-01T00:00:00Z", taiMinusUtcSeconds: 34 },
  { effectiveAt: "2012-07-01T00:00:00Z", taiMinusUtcSeconds: 35 },
  { effectiveAt: "2015-07-01T00:00:00Z", taiMinusUtcSeconds: 36 },
  { effectiveAt: "2017-01-01T00:00:00Z", taiMinusUtcSeconds: 37 }
];
