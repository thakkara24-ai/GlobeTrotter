/**
 * Calculates the great-circle (straight-line) distance between two geographic coordinates
 * on Earth using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees (-90 to 90)
 * @param lon1 Longitude of point 1 in degrees (-180 to 180)
 * @param lat2 Latitude of point 2 in degrees (-90 to 90)
 * @param lon2 Longitude of point 2 in degrees (-180 to 180)
 * @returns Object with distance in meters and kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { distanceMeters: number; distanceKilometers: number } {
  if (lat1 === lat2 && lon1 === lon2) {
    return { distanceMeters: 0, distanceKilometers: 0 };
  }

  const EARTH_RADIUS_METERS = 6371000; // Mean Earth radius in meters

  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceMeters = Math.round(EARTH_RADIUS_METERS * c * 100) / 100;
  const distanceKilometers = Math.round((distanceMeters / 1000) * 100) / 100;

  return {
    distanceMeters,
    distanceKilometers,
  };
}
