import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppUsage, UsageDevice } from './app-usage';

@Injectable({
  providedIn: 'root',
})
export class AppUsageService {

  private readonly http = inject(HttpClient);

  getDevices(): Observable<UsageDevice[]> {
    return this.http.get<UsageDevice[]>(
      '/api/v1/devices',
      { timeout: 10000 }
    );
  }

  getUsage(deviceId: string): Observable<AppUsage[]> {
    return this.http.get<AppUsage[]>(
      `/api/v1/app-usage/device/${deviceId}`,
      { timeout: 10000 }
    );
  }

  getUsageByDate(
    deviceId: string,
    date: string
  ): Observable<AppUsage[]> {

    return this.http.get<AppUsage[]>(
      `/api/v1/app-usage/device/${deviceId}/date/${date}`,
      { timeout: 10000 }
    );
  }
}