import { bench, describe } from "vitest";
import type { Tolerance } from "../packages/primitives/src";
import { createDeltaTProvider } from "../packages/dataset-delta-t/src";
import { createLeapSecondProvider } from "../packages/dataset-leap-seconds/src";
import { Angle, Duration, almostEqual } from "../packages/primitives/src";
import { Instant } from "../packages/temporal/src";

const leapSeconds = createLeapSecondProvider();
const deltaT = createDeltaTProvider();

describe("benchmark: Angle", () => {
  bench("fromDegrees + toRadians", () => {
    for (let degrees = 0; degrees < 360; degrees += 10) {
      Angle.fromDegrees(degrees).toRadians();
    }
  });

  bench("normalizeDegrees (超出范围)", () => {
    for (let degrees = -720; degrees < 720; degrees += 10) {
      Angle.fromDegrees(degrees).normalizeDegrees();
    }
  });

  bench("算术 (加减)", () => {
    const a = Angle.fromDegrees(45);
    const b = Angle.fromDegrees(30);
    a.add(b);
    a.subtract(b);
  });
});

describe("benchmark: Duration", () => {
  bench("构造与换算", () => {
    Duration.fromSeconds(86400).toDays();
    Duration.fromDays(365.25).toSeconds();
    Duration.fromMilliseconds(86400000).toDays();
  });

  bench("算术 (加减乘除)", () => {
    const a = Duration.fromSeconds(1000);
    const b = Duration.fromSeconds(500);
    a.add(b);
    a.subtract(b);
    a.multiply(3);
    a.divide(2);
  });
});

describe("benchmark: Tolerance", () => {
  bench("almostEqual (小数值)", () => {
    for (let i = 0; i < 100; i++) {
      almostEqual(i * 0.01, i * 0.01 + 1e-6, { absolute: 1e-5 });
    }
  });

  bench("对象构造", () => {
    const t1: Tolerance = { absolute: 1 / 3600 };
    const t2: Tolerance = { absolute: 0.1 / 3600 };
    const t3: Tolerance = { absolute: 10 / 3600 };
    void t1;
    void t2;
    void t3;
  });
});

describe("benchmark: Instant", () => {
  const instantCtx = { leapSeconds, deltaT };

  bench("fromUTC 构造", () => {
    Instant.fromUTC("2024-06-15T12:00:00Z", instantCtx);
    Instant.fromUTC("2024-06-15T20:00:00+08:00", instantCtx);
    Instant.fromUTC("1900-01-01T00:00:00Z", instantCtx);
  });

  bench("→ JD 转换", () => {
    const instant = Instant.fromUTC("2024-06-15T12:00:00Z", instantCtx);

    instant.toJulianDay();
    instant.toJulianEphemerisDay();
  });

  bench("→ 多时间尺度", () => {
    const instant = Instant.fromUTC("2024-06-15T12:00:00Z", instantCtx);

    instant.toTT();
    instant.toUT1();
    instant.toUTCDateTime();
  });
});
