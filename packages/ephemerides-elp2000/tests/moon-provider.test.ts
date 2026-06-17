import { describe, expect, it } from "vitest";
import lunarStandards from "../../../standards/lunar/phases.json";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { createVSOP87SunProvider } from "../../ephemerides-vsop87/src";
import { EphemerisError, Precision } from "../../ephemerides/src";
import { Body, Origin, ReferenceFrame } from "../../reference/src";
import { Instant } from "../../temporal/src";
import { createELP2000MoonProvider, lunarEclipticLongitude, lunarEclipticPosition } from "../src";
import { expectAlmostEqual } from "./helpers";

const SYZYGY_TOLERANCE = { absolute: 2.5 };

describe("@epheon/ephemerides-elp2000", () => {
  const leapSeconds = createLeapSecondProvider();
  const sunProvider = createVSOP87SunProvider();
  const moonProvider = createELP2000MoonProvider();

  it("keeps lunar-solar elongation close to bootstrap syzygy standards", () => {
    for (const sample of lunarStandards.syzygies) {
      const instant = Instant.fromUTC(sample.instant, { leapSeconds });
      const moonLongitude = lunarEclipticLongitude(instant, {
        frame: ReferenceFrame.TrueOfDateEcliptic
      });
      const sunLongitude = sunProvider.position(Body.Sun, instant, {
        frame: ReferenceFrame.TrueOfDateEcliptic
      }).coordinates.longitude;

      expectAlmostEqual(
        normalizeSignedDegrees(
          moonLongitude.normalizeDegrees().toDegrees() -
            sunLongitude.normalizeDegrees().toDegrees() -
            sample.expectedElongationDegrees
        ),
        0,
        SYZYGY_TOLERANCE
      );
    }
  });

  it("returns geocentric lunar ecliptic positions and keeps mean-of-date as the default frame", () => {
    const instant = Instant.fromUTC("2024-04-08T18:21:00Z", { leapSeconds });
    const position = moonProvider.position(Body.Moon, instant);
    const apparentPosition = lunarEclipticPosition(instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    });

    expect(position.origin).toBe(Origin.Geocentric);
    expect(position.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(position.coordinates.distance?.toAU()).toBeGreaterThan(0.0023);
    expect(position.coordinates.distance?.toAU()).toBeLessThan(0.0028);
    expect(apparentPosition.frame).toBe(ReferenceFrame.TrueOfDateEcliptic);
  });

  it("rejects unsupported body, frame, and precision requests", () => {
    const instant = Instant.fromUTC("2024-04-08T18:21:00Z", { leapSeconds });

    expect(() => moonProvider.position(Body.Sun, instant)).toThrow(EphemerisError);
    expect(() =>
      moonProvider.position(Body.Moon, instant, {
        frame: ReferenceFrame.ICRS
      })
    ).toThrow(EphemerisError);
    expect(() =>
      moonProvider.position(Body.Moon, instant, {
        precision: Precision.High
      })
    ).toThrow(EphemerisError);
  });
});

/**
 * 将差值归一化到 [-180, 180)。
 *
 * @param degrees 任意角差。
 * @returns 归一化后的有符号角差。
 */
function normalizeSignedDegrees(degrees: number): number {
  const normalized = (((degrees + 180) % 360) + 360) % 360;

  return normalized - 180;
}
