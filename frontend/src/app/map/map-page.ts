import { ChangeDetectionStrategy, Component, DestroyRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, Subject, catchError, exhaustMap, forkJoin, of, switchMap, timer } from 'rxjs';
import { DeviceService } from '../devices/device-service';
import { Device } from '../devices/device';
import { LocationService } from './location-service';
import { MapCanvas } from './map-canvas';
import { MapLocation, SafeZone, Visit, deviceZone, distanceMeters, peruToday, simplifyTrail, validCoordinates, validLocation, validZone } from './map-models';

@Component({
  selector: 'app-map-page', standalone: true, imports: [DatePipe, DecimalPipe, MapCanvas],
  templateUrl: './map-page.html', styleUrl: './map-page.css', changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPage {
  @ViewChild(MapCanvas) private canvas?: MapCanvas;
  private readonly devicesApi = inject(DeviceService);
  private readonly locationsApi = inject(LocationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private work = new Subscription();
  private live?: Subscription;
  private historyRequest?: Subscription;
  private watchId?: number;
  private observerPosition?: { lat: number; lon: number };
  private readonly addressRequests = new Subject<MapLocation | null>();
  readonly devices = signal<Device[]>([]);
  readonly devicesLoading = signal(true);
  readonly devicesError = signal(false);
  readonly selectedId = signal('');
  readonly device = signal<Device | null>(null);
  readonly configLoading = signal(false);
  readonly configError = signal(false);
  readonly mode = signal<'live' | 'edit' | 'history'>('live');
  readonly locationLoading = signal(false);
  readonly locationError = signal(false);
  readonly invalidPoints = signal(0);
  readonly latest = signal<MapLocation | null>(null);
  readonly draft = signal<SafeZone | null>(null);
  readonly saving = signal(false);
  readonly saveError = signal('');
  readonly notice = signal('');
  readonly autoCenter = signal(true);
  readonly date = signal(peruToday());
  readonly historyDate = signal('');
  readonly historyLoading = signal(false);
  readonly historyError = signal(false);
  readonly visitsError = signal(false);
  readonly historyPoints = signal<MapLocation[]>([]);
  readonly historyIndex = signal(0);
  readonly visits = signal<Visit[]>([]);
  readonly address = signal('');
  readonly geolocationMessage = signal('');
  readonly now = signal(Date.now());
  readonly savedZone = computed(() => this.device() ? deviceZone(this.device()!) : null);
  readonly displayedZone = computed(() => this.mode() === 'edit' ? this.draft() : this.savedZone());
  readonly canSave = computed(() => validZone(this.draft()) && this.draft()!.safeRadius >= 50 && this.draft()!.safeRadius <= 2000);
  readonly position = computed(() => this.mode() === 'history' ? this.historyPoints()[this.historyIndex()] ?? null : this.latest());
  readonly trail = computed(() => this.mode() === 'history' ? simplifyTrail(this.historyPoints()) : []);
  readonly minutesOld = computed(() => {
    const at = this.position()?.recordedAt;
    return at ? Math.max(0, Math.floor((this.now() - Date.parse(at)) / 60000)) : null;
  });
  readonly distance = computed(() => {
    const p = this.position(), z = this.savedZone();
    return p && z ? distanceMeters(z.safeLatitude, z.safeLongitude, p.latitude, p.longitude) : null;
  });
  readonly outside = computed(() => this.distance() !== null && this.distance()! > this.savedZone()!.safeRadius);
  readonly mapsUrl = computed(() => {
    const p = this.position();
    return p ? `https://www.google.com/maps?q=${p.latitude},${p.longitude}` : '';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.work.unsubscribe();
      if (this.watchId !== undefined) navigator.geolocation.clearWatch(this.watchId);
    });
    this.addressRequests.pipe(
      switchMap((point) => point ? timer(800).pipe(
        switchMap(() => this.locationsApi.getAddress(point.latitude, point.longitude)),
        catchError(() => of('Dirección no disponible')),
      ) : of('')),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((text) => this.address.set(text));
    timer(0, 30000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.now.set(Date.now()));
    this.loadDevices();
  }

  loadDevices(): void {
    this.devicesLoading.set(true); this.devicesError.set(false);
    this.devicesApi.getDevices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (devices) => {
        this.devices.set(devices); this.devicesLoading.set(false);
        const requested = this.route.snapshot.queryParamMap.get('device');
        const first = devices.find((d) => d.id === requested) ?? devices[0];
        if (first) this.selectDevice(first.id);
      },
      error: () => { this.devicesLoading.set(false); this.devicesError.set(true); },
    });
  }

  selectDevice(id: string): void {
    if (this.saving()) return;
    this.work.unsubscribe(); this.work = new Subscription();
    this.addressRequests.next(null); this.device.set(null); this.latest.set(null);
    this.selectedId.set(id); this.mode.set('live'); this.draft.set(null);
    this.historyPoints.set([]); this.visits.set([]); this.historyLoading.set(false);
    this.configLoading.set(true); this.configError.set(false); this.locationError.set(false);
    this.locationLoading.set(false); this.invalidPoints.set(0); this.notice.set(''); this.saveError.set(''); this.autoCenter.set(true);
    this.work.add(this.devicesApi.getDevice(id).subscribe({
      next: (device) => { this.device.set(device); this.configLoading.set(false); this.startLive(); },
      error: () => { this.configLoading.set(false); this.configError.set(true); },
    }));
  }

  startLive(): void {
    this.live?.unsubscribe();
    const id = this.device()?.id;
    if (!id || this.mode() !== 'live') return;
    this.locationLoading.set(true); this.locationError.set(false);
    this.live = timer(0, 4000).pipe(
      exhaustMap(() => this.locationsApi.getLocations(id).pipe(catchError(() => {
        this.locationError.set(true); this.locationLoading.set(false); return of(null);
      }))),
    ).subscribe((rows) => {
      if (rows === null) return;
      const valid = rows.filter(validLocation);
      this.invalidPoints.set(rows.length - valid.length); this.latest.set(valid[0] ?? null);
      this.now.set(Date.now()); this.locationLoading.set(false); this.locationError.set(false);
    });
    this.work.add(this.live);
  }

  editZone(): void {
    if (!this.device() || this.saving()) return;
    this.live?.unsubscribe(); this.historyRequest?.unsubscribe(); this.addressRequests.next(null);
    this.locationLoading.set(false);
    this.historyLoading.set(false); this.historyPoints.set([]); this.visits.set([]);
    const p = this.latest();
    this.draft.set({ ...(this.savedZone() ?? { safeLatitude: p?.latitude ?? NaN, safeLongitude: p?.longitude ?? NaN, safeRadius: 500 }) });
    this.mode.set('edit'); this.saveError.set(''); this.notice.set('');
  }
  pickCenter(center: { lat: number; lon: number }): void {
    if (this.mode() !== 'edit' || this.saving()) return;
    this.draft.update((zone) => ({ safeLatitude: center.lat, safeLongitude: center.lon, safeRadius: zone?.safeRadius ?? 500 }));
  }
  setDraft(field: keyof SafeZone, value: string): void {
    if (this.saving()) return;
    this.draft.update((zone) => zone ? { ...zone, [field]: value.trim() === '' ? NaN : Number(value) } : null);
  }
  draftValue(field: keyof SafeZone): number | '' {
    const n = this.draft()?.[field]; return n !== undefined && Number.isFinite(n) ? n : '';
  }
  cancelEdit(): void {
    if (this.saving()) return;
    this.draft.set(null); this.saveError.set(''); this.mode.set('live'); this.startLive();
  }
  saveZone(): void {
    if (!this.canSave() || this.saving() || !this.device()) return;
    this.saving.set(true); this.saveError.set('');
    this.work.add(this.devicesApi.updateSafeZone(this.device()!.id, this.draft()!).subscribe({
      next: (device) => {
        this.device.set(device); this.saving.set(false); this.draft.set(null); this.mode.set('live');
        this.notice.set('Geocerca guardada.'); this.startLive();
      },
      error: () => { this.saving.set(false); this.saveError.set('No se pudo guardar la geocerca. Tus cambios siguen disponibles para reintentar.'); },
    }));
  }

  loadHistory(): void {
    if (!this.device() || this.saving() || !/^\d{4}-\d{2}-\d{2}$/.test(this.date())) return;
    this.live?.unsubscribe(); this.historyRequest?.unsubscribe(); this.addressRequests.next(null);
    this.mode.set('history'); this.draft.set(null); this.notice.set(''); this.historyPoints.set([]); this.visits.set([]);
    this.historyIndex.set(0); this.historyLoading.set(true); this.historyError.set(false); this.visitsError.set(false);
    const date = this.date(), id = this.device()!.id;
    this.historyDate.set(date);
    this.historyRequest = forkJoin({
      points: this.locationsApi.getHistory(id, date),
      visits: this.locationsApi.getVisits(id).pipe(catchError(() => { this.visitsError.set(true); return of([]); })),
    }).subscribe({
      next: ({ points, visits }) => {
        const valid = points.filter(validLocation);
        this.invalidPoints.set(points.length - valid.length);
        this.historyPoints.set(valid); this.historyLoading.set(false);
        this.visits.set(visits.filter((v) => v.horaEntrada.startsWith(date) && (v.duracionMinutos ?? 0) >= 3 && validCoordinates(v.latitud, v.longitud)));
        this.selectHistoryPoint(0);
      },
      error: () => { this.historyLoading.set(false); this.historyError.set(true); },
    });
    this.work.add(this.historyRequest);
  }
  selectHistoryPoint(index: number): void {
    this.historyIndex.set(Math.max(0, Math.min(index, this.historyPoints().length - 1)));
    const point = this.position();
    this.address.set(point ? 'Buscando dirección…' : ''); this.addressRequests.next(point);
  }
  returnLive(): void {
    if (this.saving()) return;
    this.historyRequest?.unsubscribe(); this.addressRequests.next(null); this.historyLoading.set(false);
    this.historyPoints.set([]); this.visits.set([]); this.mode.set('live'); this.autoCenter.set(true); this.startLive();
  }
  focusVisit(visit: Visit): void { this.autoCenter.set(false); this.canvas?.focus(visit.latitud, visit.longitud); }
  locateMe(): void {
    if (!navigator.geolocation) { this.geolocationMessage.set('Este navegador no ofrece geolocalización.'); return; }
    this.autoCenter.set(false);
    if (this.observerPosition) { this.canvas?.showObserver(this.observerPosition.lat, this.observerPosition.lon, true); return; }
    if (this.watchId !== undefined) return;
    this.geolocationMessage.set('Buscando tu ubicación…');
    let first = true;
    this.watchId = navigator.geolocation.watchPosition((position) => {
      this.observerPosition = { lat: position.coords.latitude, lon: position.coords.longitude };
      this.canvas?.showObserver(this.observerPosition.lat, this.observerPosition.lon, first);
      first = false; this.geolocationMessage.set('Tu ubicación se muestra solo en este navegador.');
    }, () => {
      this.geolocationMessage.set('No se pudo obtener tu ubicación. Revisa los permisos del navegador.');
      if (this.watchId !== undefined) navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 });
  }
}
