import { describe, expect, it } from 'vitest';
import { deviceZone, distanceMeters, MapLocation, simplifyTrail, validCoordinates, validZone } from './map-models';
import { Device } from '../devices/device';

describe('Coordenadas y geocerca', () => {
  it('acepta el ecuador y rechaza coordenadas nulas o fuera de rango', () => {
    expect(validCoordinates(0, 0)).toBe(true);
    expect(validCoordinates(null, 0)).toBe(false);
    expect(validCoordinates(91, 0)).toBe(false);
    expect(validCoordinates(0, Infinity)).toBe(false);
    expect(validZone({ safeLatitude: 0, safeLongitude: 0, safeRadius: -1 })).toBe(false);
  });
  it('recupera el centro persistido y el radio de respaldo del backend', () => {
    expect(deviceZone({ safeLatitude: 0, safeLongitude: 0, safeRadius: null } as Device))
      .toEqual({ safeLatitude: 0, safeLongitude: 0, safeRadius: 500 });
    expect(deviceZone({ safeLatitude: null, safeLongitude: null, safeRadius: 500 } as Device)).toBeNull();
  });
  it('calcula distancias conocidas y elimina solo el ruido menor a 15 metros', () => {
    expect(distanceMeters(0, 0, 0, 0)).toBe(0);
    expect(distanceMeters(0, 0, 0, 1)).toBeCloseTo(111194.93, 1);
    const points = [0, .00001, .001].map((longitude) => ({ latitude: 0, longitude } as MapLocation));
    expect(simplifyTrail(points)).toEqual([points[0], points[2]]);
    expect(simplifyTrail([])).toEqual([]);
  });
});
