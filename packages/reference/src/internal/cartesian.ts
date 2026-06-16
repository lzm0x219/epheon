import { Angle, Vector3 } from "@epheon/primitives";
import { SphericalCoordinates } from "../coordinate";
import { Distance } from "../distance";

/**
 * 将球面坐标转换为内部笛卡尔向量。
 *
 * @param coordinates 球面坐标。
 * @returns 以 AU 为单位的笛卡尔向量。
 */
export function sphericalToCartesian(coordinates: SphericalCoordinates): Vector3 {
  const radius = coordinates.distance?.toAU() ?? 1;
  const longitude = coordinates.longitude.toRadians();
  const latitude = coordinates.latitude.toRadians();
  const cosLatitude = Math.cos(latitude);

  return Vector3.fromXYZ(
    radius * cosLatitude * Math.cos(longitude),
    radius * cosLatitude * Math.sin(longitude),
    radius * Math.sin(latitude)
  );
}

/**
 * 将内部笛卡尔向量转换为球面坐标。
 *
 * @param vector 以 AU 为单位的笛卡尔向量。
 * @returns 对应的球面坐标。
 */
export function cartesianToSpherical(vector: Vector3): SphericalCoordinates {
  const radius = vector.magnitude();

  if (radius === 0) {
    return SphericalCoordinates.from({
      longitude: Angle.fromRadians(0),
      latitude: Angle.fromRadians(0),
      distance: Distance.fromAU(0)
    });
  }

  let longitude = Math.atan2(vector.y, vector.x);
  if (longitude < 0) {
    longitude += Math.PI * 2;
  }

  return SphericalCoordinates.from({
    longitude: Angle.fromRadians(longitude),
    latitude: Angle.fromRadians(Math.asin(vector.z / radius)),
    distance: Distance.fromAU(radius)
  });
}
