import { calculateHaversineDistance } from '../utils/distance';

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  origin: RouteCoordinates;
  destination: RouteCoordinates;
  distanceMeters: number;
  distanceKilometers: number;
  roadDistanceMeters: number | null;
  roadTravelTimeSeconds: number | null;
  calculationType: 'straight-line' | 'road-network';
  roadRouteAvailable: boolean;
  status: 'available' | 'unavailable';
  polyline?: string | null;
}

export interface IRoutingProvider {
  calculateRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates
  ): Promise<RouteResult>;
}

/**
 * Default fallback provider using deterministic straight-line calculation.
 * Explicitly marks road routes and travel times as unavailable rather than fabricating fake road data.
 */
export class StraightLineRoutingProvider implements IRoutingProvider {
  async calculateRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates
  ): Promise<RouteResult> {
    const { distanceMeters, distanceKilometers } = calculateHaversineDistance(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude
    );

    return {
      origin,
      destination,
      distanceMeters,
      distanceKilometers,
      roadDistanceMeters: null,
      roadTravelTimeSeconds: null,
      calculationType: 'straight-line',
      roadRouteAvailable: false,
      status: 'unavailable',
      polyline: null,
    };
  }
}

class RoutingService {
  private provider: IRoutingProvider;

  constructor(provider: IRoutingProvider = new StraightLineRoutingProvider()) {
    this.provider = provider;
  }

  setProvider(provider: IRoutingProvider): void {
    this.provider = provider;
  }

  async calculateRoute(
    origin: RouteCoordinates,
    destination: RouteCoordinates
  ): Promise<RouteResult> {
    return this.provider.calculateRoute(origin, destination);
  }
}

export default new RoutingService();
