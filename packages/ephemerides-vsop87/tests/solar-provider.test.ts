import { describe, expect, it } from "vitest";
import longitudeStandards from "../../../standards/solar/longitudes.json";
import { createLeapSecondProvider } from "../../dataset-leap-seconds/src";
import { EphemerisError, Precision } from "../../ephemerides/src";
import { Body, Origin, ReferenceFrame } from "../../reference/src";
import { Instant } from "../../temporal/src";
import { createVSOP87SunProvider, solarEclipticLongitude, solarEclipticPosition } from "../src";
import { expectAlmostEqual } from "./helpers";

const TRUE_LONGITUDE_TOLERANCE = { absolute: 0.01 };
const MEAN_LONGITUDE_TOLERANCE = { absolute: 0.02 };

describe("@epheon/ephemerides-vsop87", () => {
  const leapSeconds = createLeapSecondProvider();
  const provider = createVSOP87SunProvider();

  it("computes true-of-date solar longitudes against bootstrap standards", () => {
    for (const sample of longitudeStandards.solarLongitudes) {
      const instant = Instant.fromUTC(sample.input, { leapSeconds });
      const longitude = solarEclipticLongitude(instant, {
        frame: ReferenceFrame.TrueOfDateEcliptic
      });

      expectAlmostEqual(
        longitude.normalizeDegrees().toDegrees(),
        sample.longitudeDegrees,
        TRUE_LONGITUDE_TOLERANCE
      );
    }
  });

  it("returns geocentric ecliptic positions and keeps mean-of-date as the default frame", () => {
    const instant = Instant.fromUTC("2024-06-20T20:51:01Z", { leapSeconds });
    const position = provider.position(Body.Sun, instant);
    const apparentPosition = solarEclipticPosition(instant, {
      frame: ReferenceFrame.TrueOfDateEcliptic
    });

    expect(position.origin).toBe(Origin.Geocentric);
    expect(position.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(position.coordinates.latitude.toDegrees()).toBe(0);
    expect(position.coordinates.distance?.toAU()).toBeGreaterThan(1);
    expect(position.coordinates.distance?.toAU()).toBeLessThan(1.1);
    expect(apparentPosition.frame).toBe(ReferenceFrame.TrueOfDateEcliptic);
    expectAlmostEqual(
      position.coordinates.longitude.normalizeDegrees().toDegrees(),
      90,
      MEAN_LONGITUDE_TOLERANCE
    );
  });

  it("rejects unsupported body, frame, and precision requests", () => {
    const instant = Instant.fromUTC("2024-06-20T20:51:01Z", { leapSeconds });

    expect(() => provider.position(Body.Moon, instant)).toThrow(EphemerisError);
    expect(() =>
      provider.position(Body.Sun, instant, {
        frame: ReferenceFrame.ICRS
      })
    ).toThrow(EphemerisError);
    expect(() =>
      provider.position(Body.Sun, instant, {
        precision: Precision.High
      })
    ).toThrow(EphemerisError);
  });
});
