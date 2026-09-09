import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CallDevice, CallLog } from './call';

@Injectable({
  providedIn: 'root',
})
export class CallService {

  private readonly http = inject(HttpClient);

  getDevices(): Observable<CallDevice[]> {
    return this.http.get<CallDevice[]>(
      '/api/v1/devices',
      { timeout: 10000 }
    );
  }

  getCalls(deviceId: string): Observable<CallLog[]> {
    return this.http.get<CallLog[]>(
      `/api/v1/calls/device/${deviceId}`,
      { timeout: 10000 }
    );
  }
}