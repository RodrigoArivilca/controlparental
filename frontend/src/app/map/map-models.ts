import { Device } from '../devices/device';

export interface DeviceLocation {
  id: string;
  device: Device;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  deviceModel: string | null;
  recordedAt: string | null;
}

export type MapLocation = DeviceLocation & { latitude: number; longitude: number };
export interface SafeZone { safeLatitude: number; safeLongitude: number; safeRadius: number; }
export interface Visit {
  id: number;
  deviceId: string;
  latitud: number;
  longitud: number;
  direccion: string | null;
  nombreLugar: string | null;
  /** LocalDateTime del servidor, sin offset, tal como lo devuelve Visita.java. */
  horaEntrada: string;
  horaSalida: string | null;
  duracionMinutos: number | null;
}
export interface ReverseAddress {
  display_name?: string;
  address?: { road?: string; suburb?: string; city?: string; town?: string };
}

export function validCoordinates(lat: number | null, lon: number | null): boolean {
  return lat !== null && lon !== null && Number.isFinite(lat) && Number.isFinite(lon)
    && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}
export function validLocation(location: DeviceLocation): location is MapLocation {
  return validCoordinates(location.latitude, location.longitude);
}
export function validZone(zone: SafeZone | null): zone is SafeZone {
  return zone !== null && validCoordinates(zone.safeLatitude, zone.safeLongitude)
    && Number.isFinite(zone.safeRadius) && zone.safeRadius > 0;
}
export function deviceZone(device: Device): SafeZone | null {
  const zone = { safeLatitude: device.safeLatitude!, safeLongitude: device.safeLongitude!, safeRadius: device.safeRadius ?? 500 };
  return validZone(zone) ? zone : null;
}

/** Misma fórmula de Haversine y radio terrestre de LocationService.java. */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}
export function simplifyTrail(points: MapLocation[]): MapLocation[] {
  return points.reduce<MapLocation[]>((result, point) => {
    const last = result.at(-1);
    if (!last || distanceMeters(last.latitude, last.longitude, point.latitude, point.longitude) > 15) result.push(point);
    return result;
  }, []);
}
export function peruToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
