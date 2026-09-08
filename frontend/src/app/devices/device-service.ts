import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from './device';
import { SafeZone } from '../map/map-models';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/v1/devices', { timeout: 10000 });
  }

  getDevice(id: string): Observable<Device> {
    return this.http.get<Device>(`/api/v1/devices/${encodeURIComponent(id)}`, { timeout: 10000 });
  }

  updateSafeZone(id: string, zone: SafeZone): Observable<Device> {
    return this.http.put<Device>(`/api/v1/devices/${encodeURIComponent(id)}/safe-zone`, zone, { timeout: 10000 });
  }
}
