import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, of, tap } from 'rxjs';
import { DeviceLocation, ReverseAddress, Visit } from './map-models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly addresses = new Map<string, string>();

  getLocations(id: string): Observable<DeviceLocation[]> {
    return this.http.get<DeviceLocation[]>(`/api/v1/locations/device/${encodeURIComponent(id)}`, { timeout: 10000 });
  }
  getHistory(id: string, date: string): Observable<DeviceLocation[]> {
    return this.http.get<DeviceLocation[]>(`/api/v1/locations/device/${encodeURIComponent(id)}/history`, { params: { date }, timeout: 10000 });
  }
  getVisits(id: string): Observable<Visit[]> {
    return this.http.get<Visit[]>(`/api/v1/locations/device/${encodeURIComponent(id)}/visitas`, { timeout: 10000 });
  }
  getAddress(lat: number, lon: number): Observable<string> {
    const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = this.addresses.get(key);
    if (cached) return of(cached);
    return this.http.get<ReverseAddress>('/api/v1/locations/address', { params: { lat, lon }, timeout: 10000 }).pipe(
      map((result) => {
        const address = result.address;
        return [address?.road, address?.suburb || address?.city || address?.town].filter(Boolean).join(', ')
          || result.display_name || 'Dirección no disponible';
      }),
      tap((address) => { if (this.addresses.size >= 200) this.addresses.clear(); this.addresses.set(key, address); }),
    );
  }
}
