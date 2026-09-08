import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPage } from './map-page';
import { Device } from '../devices/device';

const device: Device = {
  id: 'device-test', deviceName: 'Prueba unitaria', model: null, androidVersion: null,
  fcmToken: null, isOnline: false, role: 'CONTROLLED', safeLatitude: 0, safeLongitude: 0,
  safeRadius: 500, lastConnection: null, createdAt: null,
};

describe('Mapa: orquestación y contrato HTTP (simulados)', () => {
  let fixture: ComponentFixture<MapPage>;
  let http: HttpTestingController;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [MapPage],
      providers: [provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } }],
    });
    // Leaflet se verifica en Edge. Aquí aislamos las decisiones y las solicitudes HTTP.
    TestBed.overrideComponent(MapPage, { set: { template: '', imports: [] } });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MapPage);
    http.expectOne('/api/v1/devices').flush([device]);
    http.expectOne('/api/v1/devices/device-test').flush(device);
  });
  afterEach(() => { fixture.destroy(); http.verify({ ignoreCancelled: true }); vi.useRealTimers(); });

  it('consulta cada 4 segundos, maneja lista vacía/error y cancela al salir', () => {
    vi.advanceTimersByTime(0);
    http.expectOne('/api/v1/locations/device/device-test').flush([]);
    expect(fixture.componentInstance.latest()).toBeNull();
    expect(fixture.componentInstance.locationLoading()).toBe(false);
    vi.advanceTimersByTime(4000);
    http.expectOne('/api/v1/locations/device/device-test').error(new ProgressEvent('error'));
    expect(fixture.componentInstance.locationError()).toBe(true);
    vi.advanceTimersByTime(4000);
    const pending = http.expectOne('/api/v1/locations/device/device-test');
    fixture.destroy();
    expect(pending.cancelled).toBe(true);
    vi.advanceTimersByTime(8000);
    http.expectNone('/api/v1/locations/device/device-test');
  });

  it('cancelar restaura la geocerca guardada sin enviar PUT', () => {
    const page = fixture.componentInstance;
    page.editZone(); page.pickCenter({ lat: 10, lon: 20 }); page.setDraft('safeRadius', '1000');
    expect(page.displayedZone()?.safeRadius).toBe(1000);
    page.cancelEdit();
    expect(page.displayedZone()).toEqual({ safeLatitude: 0, safeLongitude: 0, safeRadius: 500 });
    http.expectNone((r) => r.method === 'PUT');
  });

  it('guarda números por PUT, conserva el borrador ante error y usa la respuesta final', () => {
    const page = fixture.componentInstance;
    page.editZone(); page.setDraft('safeRadius', '750'); page.saveZone();
    const request = http.expectOne('/api/v1/devices/device-test/safe-zone');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ safeLatitude: 0, safeLongitude: 0, safeRadius: 750 });
    request.flush({}, { status: 500, statusText: 'Error' });
    expect(page.mode()).toBe('edit'); expect(page.draft()?.safeRadius).toBe(750);
    expect(page.saveError()).not.toBe('');
    page.saveZone();
    http.expectOne('/api/v1/devices/device-test/safe-zone').flush({ ...device, safeRadius: 750 });
    expect(page.savedZone()?.safeRadius).toBe(750); expect(page.mode()).toBe('live');
  });

  it('no envía una geocerca incompleta o fuera de rango', () => {
    const page = fixture.componentInstance;
    page.editZone(); page.setDraft('safeLatitude', ''); page.saveZone();
    expect(page.canSave()).toBe(false);
    page.setDraft('safeLatitude', '91'); page.saveZone();
    http.expectNone((r) => r.method === 'PUT');
  });

  it('cancela la consulta anterior cuando cambia el dispositivo', () => {
    vi.advanceTimersByTime(0);
    const pending = http.expectOne('/api/v1/locations/device/device-test');
    fixture.componentInstance.selectDevice('second');
    expect(pending.cancelled).toBe(true);
    http.expectOne('/api/v1/devices/second').flush({ ...device, id: 'second', safeLatitude: null, safeLongitude: null });
    expect(fixture.componentInstance.savedZone()).toBeNull();
    expect(fixture.componentInstance.latest()).toBeNull();
  });

  it('consulta historial con fecha y visitas, pausa sondeo y admite días vacíos', () => {
    const page = fixture.componentInstance;
    page.date.set('2026-09-08'); page.loadHistory();
    const request = http.expectOne('/api/v1/locations/device/device-test/history?date=2026-09-08');
    expect(request.request.method).toBe('GET'); request.flush([]);
    http.expectOne('/api/v1/locations/device/device-test/visitas').flush([]);
    expect(page.historyLoading()).toBe(false); expect(page.historyPoints()).toEqual([]);
    vi.advanceTimersByTime(8000);
    http.expectNone('/api/v1/locations/device/device-test');
    page.returnLive(); vi.advanceTimersByTime(0);
    http.expectOne('/api/v1/locations/device/device-test').flush([]);
  });
});
