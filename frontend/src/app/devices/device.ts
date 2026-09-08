/** Respuesta de GET /api/v1/devices (Device.java), sin transformar entidades. */
export interface Device {
  id: string;
  deviceName: string;
  model: string | null;
  androidVersion: string | null;
  fcmToken: string | null;
  isOnline: boolean | null;
  // El backend admite texto libre: no se restringe artificialmente a un enum.
  role: string | null;
  safeLatitude: number | null;
  safeLongitude: number | null;
  safeRadius: number | null;
  /** OffsetDateTime serializado como texto ISO 8601. */
  lastConnection: string | null;
  createdAt: string | null;
}
