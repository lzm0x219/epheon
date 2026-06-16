import {
  Body,
  Distance,
  Origin,
  Position,
  ReferenceFrame,
  SphericalCoordinates
} from "@epheon/reference";
import { Instant } from "@epheon/temporal";
import { describe, expect, it } from "vitest";
import { EphemerisError, Precision, resolveEphemerisOptions, type EphemerisProvider } from "../src";

describe("@epheon/ephemerides", () => {
  it("exports stable precision labels", () => {
    expect(Precision.FastLow).toBe("FAST_LOW");
    expect(Precision.Standard).toBe("STANDARD");
    expect(Precision.High).toBe("HIGH");
  });

  it("fills default frame and precision", () => {
    const defaults = resolveEphemerisOptions();
    const partial = resolveEphemerisOptions({
      precision: Precision.FastLow
    });

    expect(defaults.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(defaults.precision).toBe(Precision.Standard);
    expect(partial.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(partial.precision).toBe(Precision.FastLow);
  });

  it("keeps provider implementations on a single structured error model", () => {
    const sunOnlyProvider: EphemerisProvider = {
      position(body, instant, options) {
        const resolved = resolveEphemerisOptions(options);

        if (body !== Body.Sun) {
          throw new EphemerisError("UnsupportedBody", `Unsupported body: ${body}.`);
        }

        if (!resolved.frame.equals(ReferenceFrame.MeanOfDateEcliptic)) {
          throw new EphemerisError("InvalidFrame", `Unsupported frame: ${resolved.frame.name}.`);
        }

        if (resolved.precision !== Precision.Standard) {
          throw new EphemerisError(
            "UnsupportedPrecision",
            `Unsupported precision: ${resolved.precision}.`
          );
        }

        return Position.from({
          coordinates: SphericalCoordinates.from({
            longitudeDegrees: 90,
            latitudeDegrees: 0,
            distance: Distance.fromAU(1)
          }),
          frame: resolved.frame,
          origin: Origin.Geocentric
        });
      }
    };

    const instant = Instant.fromUTC("2026-06-21T00:00:00Z");
    const position = sunOnlyProvider.position(Body.Sun, instant);

    expect(position.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(() => sunOnlyProvider.position(Body.Moon, instant)).toThrow(EphemerisError);
    expect(() =>
      sunOnlyProvider.position(Body.Sun, instant, {
        frame: ReferenceFrame.ICRS
      })
    ).toThrow(EphemerisError);
    expect(() =>
      sunOnlyProvider.position(Body.Sun, instant, {
        precision: Precision.High
      })
    ).toThrow(EphemerisError);
  });

  it("preserves the structured error code on ephemeris failures", () => {
    const error = new EphemerisError("PositionUnavailable", "No ephemeris data for this instant.");

    expect(error.name).toBe("EphemerisError");
    expect(error.code).toBe("PositionUnavailable");
  });
});
