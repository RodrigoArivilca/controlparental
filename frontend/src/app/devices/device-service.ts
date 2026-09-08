import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Device } from './device';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly http = inject(HttpClient);

  getDevices(): Observable<Device[]> {
    return this.http.get<Device[]>('/api/v1/devices', { timeout: 10000 });
  }
}
