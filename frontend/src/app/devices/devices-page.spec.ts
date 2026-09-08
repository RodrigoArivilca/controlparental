import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DevicesPage } from './devices-page';
import { Device } from './device';

describe('Dispositivos: contrato HTTP y estados visibles (HTTP simulado)', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DevicesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('consulta la ruta relativa y muestra carga hasta recibir la respuesta', () => {
    const fixture = TestBed.createComponent(DevicesPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando dispositivos');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    const request = http.expectOne('/api/v1/devices');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('muestra la lista vacía sin inventar dispositivos', () => {
    const fixture = TestBed.createComponent(DevicesPage);
    http.expectOne('/api/v1/devices').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay dispositivos');
    expect(fixture.nativeElement.querySelectorAll('.device-card').length).toBe(0);
  });

  it('permite reintentar después de un error de conexión', () => {
    const fixture = TestBed.createComponent(DevicesPage);
    http.expectOne('/api/v1/devices').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent)
      .toContain('No se pudieron cargar los dispositivos');
    fixture.nativeElement.querySelector('.primary').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando dispositivos');
    http.expectOne('/api/v1/devices').flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay dispositivos');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('presenta campos nulos y nombres como texto, sin insertar HTML ni tokens', () => {
    const device: Device = {
      id: 'id-solo-para-prueba-unitaria', deviceName: '<img src=x onerror=alert(1)>',
      model: null, androidVersion: null, fcmToken: 'token-ficticio-no-visible',
      isOnline: null, role: 'CONTROLLED', safeLatitude: null, safeLongitude: null,
      safeRadius: null, lastConnection: null, createdAt: null,
    };
    const fixture = TestBed.createComponent(DevicesPage);
    http.expectOne('/api/v1/devices').flush([device]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(device.deviceName);
    expect(fixture.nativeElement.textContent).toContain('Modelo no informado');
    expect(fixture.nativeElement.textContent).toContain('Supervisado');
    expect(fixture.nativeElement.textContent).toContain('Sin información');
    expect(fixture.nativeElement.textContent).not.toContain(device.fcmToken);
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
