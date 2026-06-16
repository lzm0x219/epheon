import { PrimitiveError } from "@epheon/primitives";
import { describe, expect, it } from "vitest";
import coordinateStandards from "../../../standards/reference/coordinates.json";
import frameStandards from "../../../standards/reference/frames.json";
import {
  Body,
  CoordinateSystem,
  Distance,
  Origin,
  Position,
  ReferenceFrame,
  SphericalCoordinates
} from "../src";
import { cartesianToSpherical, sphericalToCartesian } from "../src/internal/cartesian";
import { expectAlmostEqual } from "./helpers";

const DISTANCE_TOLERANCE = { absolute: 1e-12 };
const ANGLE_TOLERANCE = { absolute: 1e-9 };

describe("@epheon/reference", () => {
  it("exports stable const objects for coordinate system, origin, and body", () => {
    expect(CoordinateSystem.Ecliptic).toBe("ECLIPTIC");
    expect(Origin.Geocentric).toBe("GEOCENTRIC");
    expect(Body.Sun).toBe("SUN");
  });

  it("reads reference-frame presets from standards", () => {
    const presets = {
      ICRS: ReferenceFrame.ICRS,
      MeanOfDateEcliptic: ReferenceFrame.MeanOfDateEcliptic,
      TrueOfDateEcliptic: ReferenceFrame.TrueOfDateEcliptic
    } as const;

    for (const standard of frameStandards.frames) {
      const frame = presets[standard.name as keyof typeof presets];

      expect(frame).toBeDefined();
      expect(frame.name).toBe(standard.name);
      expect(frame.coordinateSystem).toBe(standard.coordinateSystem);
      expect(frame.epoch?.toNumber() ?? null).toBe(standard.epochJde);
    }
  });

  it("creates distance, spherical coordinates, and positions", () => {
    const distance = Distance.fromAU(1);
    const coordinates = SphericalCoordinates.from({
      longitudeDegrees: 45,
      latitudeDegrees: 10,
      distance
    });
    const position = Position.from({
      coordinates,
      frame: ReferenceFrame.MeanOfDateEcliptic,
      origin: Origin.Geocentric
    });

    expect(distance.toAU()).toBe(1);
    expect(coordinates.distance?.toAU()).toBe(1);
    expect(position.frame).toBe(ReferenceFrame.MeanOfDateEcliptic);
    expect(position.origin).toBe(Origin.Geocentric);
  });

  it("round-trips internal cartesian helpers from standards", () => {
    for (const standard of coordinateStandards.coordinates) {
      const coordinates = SphericalCoordinates.from({
        longitudeDegrees: standard.longitudeDegrees,
        latitudeDegrees: standard.latitudeDegrees,
        distance: Distance.fromAU(standard.distanceAu)
      });
      const cartesian = sphericalToCartesian(coordinates);

      expectAlmostEqual(cartesian.x, standard.cartesian.x, DISTANCE_TOLERANCE);
      expectAlmostEqual(cartesian.y, standard.cartesian.y, DISTANCE_TOLERANCE);
      expectAlmostEqual(cartesian.z, standard.cartesian.z, DISTANCE_TOLERANCE);

      const roundTrip = cartesianToSpherical(cartesian);

      expectAlmostEqual(
        roundTrip.longitude.toDegrees(),
        standard.longitudeDegrees,
        ANGLE_TOLERANCE
      );
      expectAlmostEqual(roundTrip.latitude.toDegrees(), standard.latitudeDegrees, ANGLE_TOLERANCE);
      expectAlmostEqual(
        roundTrip.distance?.toAU() ?? Number.NaN,
        standard.distanceAu,
        DISTANCE_TOLERANCE
      );
    }
  });

  it("uses explicit tolerance for almostEquals while keeping frame and origin strict", () => {
    const left = Position.from({
      coordinates: SphericalCoordinates.from({
        longitudeDegrees: 45,
        latitudeDegrees: 10,
        distance: Distance.fromAU(1)
      }),
      frame: ReferenceFrame.MeanOfDateEcliptic,
      origin: Origin.Geocentric
    });
    const right = Position.from({
      coordinates: SphericalCoordinates.from({
        longitudeDegrees: 45.000000001,
        latitudeDegrees: 10.000000001,
        distance: Distance.fromAU(1.000000000001)
      }),
      frame: ReferenceFrame.MeanOfDateEcliptic,
      origin: Origin.Geocentric
    });
    const wrongFrame = Position.from({
      coordinates: right.coordinates,
      frame: ReferenceFrame.ICRS,
      origin: Origin.Geocentric
    });

    expect(left.almostEquals(right, { absolute: 1e-8 })).toBe(true);
    expect(left.almostEquals(wrongFrame, { absolute: 1e-8 })).toBe(false);
  });

  it("rejects invalid distance inputs and division by zero", () => {
    expect(() => Distance.fromAU(Number.NaN)).toThrow(PrimitiveError);
    expect(() => Distance.fromAU(1).divide(0)).toThrow(PrimitiveError);
  });
});
