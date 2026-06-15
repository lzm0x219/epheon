/** Delta-T 模型分段。 */
export type DeltaTPolynomialSegment = {
  /** 分段标签，便于 README 和调试定位。 */
  readonly label: string;
  /** 覆盖起点年份，含边界。 */
  readonly startYear: number;
  /** 覆盖终点年份，不含边界。 */
  readonly endYear: number;
  /** 根据十进制年份估算 Delta-T 秒数。 */
  readonly computeSeconds: (decimalYear: number) => number;
};

/** Espenak/Meeus 常用 Delta-T 多项式分段。 */
export const DELTA_T_SEGMENTS: readonly DeltaTPolynomialSegment[] = [
  {
    label: "1600-1700",
    startYear: 1600,
    endYear: 1700,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1600;
      return 120 - 0.9808 * t - 0.01532 * t * t + (t * t * t) / 7129;
    }
  },
  {
    label: "1700-1800",
    startYear: 1700,
    endYear: 1800,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1700;
      return 8.83 + 0.1603 * t - 0.0059285 * t * t + 0.00013336 * t ** 3 - t ** 4 / 1_174_000;
    }
  },
  {
    label: "1800-1860",
    startYear: 1800,
    endYear: 1860,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1800;
      return (
        13.72 -
        0.332447 * t +
        0.0068612 * t ** 2 +
        0.0041116 * t ** 3 -
        0.00037436 * t ** 4 +
        0.0000121272 * t ** 5 -
        0.0000001699 * t ** 6 +
        0.000000000875 * t ** 7
      );
    }
  },
  {
    label: "1860-1900",
    startYear: 1860,
    endYear: 1900,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1860;
      return (
        7.62 +
        0.5737 * t -
        0.251754 * t ** 2 +
        0.01680668 * t ** 3 -
        0.0004473624 * t ** 4 +
        t ** 5 / 233_174
      );
    }
  },
  {
    label: "1900-1920",
    startYear: 1900,
    endYear: 1920,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1900;
      return -2.79 + 1.494119 * t - 0.0598939 * t ** 2 + 0.0061966 * t ** 3 - 0.000197 * t ** 4;
    }
  },
  {
    label: "1920-1941",
    startYear: 1920,
    endYear: 1941,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1920;
      return 21.2 + 0.84493 * t - 0.0761 * t ** 2 + 0.0020936 * t ** 3;
    }
  },
  {
    label: "1941-1961",
    startYear: 1941,
    endYear: 1961,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1950;
      return 29.07 + 0.407 * t - t ** 2 / 233 + t ** 3 / 2547;
    }
  },
  {
    label: "1961-1986",
    startYear: 1961,
    endYear: 1986,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 1975;
      return 45.45 + 1.067 * t - t ** 2 / 260 - t ** 3 / 718;
    }
  },
  {
    label: "1986-2005",
    startYear: 1986,
    endYear: 2005,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 2000;
      return (
        63.86 +
        0.3345 * t -
        0.060374 * t ** 2 +
        0.0017275 * t ** 3 +
        0.000651814 * t ** 4 +
        0.00002373599 * t ** 5
      );
    }
  },
  {
    label: "2005-2050",
    startYear: 2005,
    endYear: 2050,
    computeSeconds: (decimalYear) => {
      const t = decimalYear - 2000;
      return 62.92 + 0.32217 * t + 0.005589 * t ** 2;
    }
  },
  {
    label: "2050-2150",
    startYear: 2050,
    endYear: 2150,
    computeSeconds: (decimalYear) => {
      const u = (decimalYear - 1820) / 100;
      return -20 + 32 * u ** 2 - 0.5628 * (2150 - decimalYear);
    }
  }
];
