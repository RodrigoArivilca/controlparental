import { expect, test } from '@playwright/test';

test('mapa, historial y geocerca persistida en PostgreSQL aislado', async ({ page, request }) => {
  test.skip(process.env['CP_MAP_ISOLATED'] !== '1', 'Requiere el clúster aislado y Seed-IsolatedDevices.ps1 -IncludeMap.');
  const devicesResponse = await request.get('/api/v1/devices');
  expect(devicesResponse.status()).toBe(200);
  const devices = await devicesResponse.json();
  const device = devices.find((d: { deviceName: string }) => d.deviceName === 'Dispositivo de prueba A');
  expect(device).toBeTruthy();
  const zoneUrl = `/api/v1/devices/${device.id}/safe-zone`;
  const original = { safeLatitude: device.safeLatitude, safeLongitude: device.safeLongitude, safeRadius: device.safeRadius };
  expect(original.safeLatitude).not.toBeNull();
  const locationsResponse = await request.get(`/api/v1/locations/device/${device.id}`);
  expect(locationsResponse.status()).toBe(200);
  expect((await locationsResponse.json()).length).toBeGreaterThan(0);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`/mapa?device=${device.id}`);
  await expect(page.getByRole('heading', { name: 'Mapa y ubicaciones' })).toBeVisible();
  await expect(page.getByLabel('Dispositivo', { exact: true })).toHaveValue(device.id);
  await expect(page.locator('.device-position')).toBeVisible();
  await expect(page.locator('.safe-zone')).toBeVisible();
  await page.getByRole('button', { name: 'Editar geocerca' }).click();
  await page.getByRole('region', { name: 'Mapa de ubicaciones' }).click({ position: { x: 100, y: 150 } });
  await expect(page.getByLabel('Latitud', { exact: true })).not.toHaveValue(String(original.safeLatitude));
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  expect((await (await request.get(`/api/v1/devices/${device.id}`)).json()).safeLatitude).toBe(original.safeLatitude);
  try {
    await page.getByRole('button', { name: 'Editar geocerca' }).click();
    await page.getByLabel('Radio (metros)').evaluate((element) => {
      (element as HTMLInputElement).value = '1000'; element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const save = page.waitForResponse((r) => r.url().endsWith('/safe-zone') && r.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Guardar geocerca', exact: true }).click();
    expect((await save).status()).toBe(200);
    await expect(page.getByText('Geocerca guardada.', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByLabel('Dispositivo', { exact: true })).toHaveValue(device.id);
    await expect(page.getByTestId('saved-radius')).toHaveText('1000 m');
    await page.getByRole('button', { name: 'Cargar historial' }).click();
    await expect(page.getByText('Estancia de prueba', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Recorrer puntos del historial')).toBeVisible();
    await page.getByLabel('Recorrer puntos del historial').evaluate((element) => {
      (element as HTMLInputElement).value = '1'; element.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(page.getByText(/Punto 2 de/)).toBeVisible();
    await page.screenshot({ path: 'test-results/mapa-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Volver al presente' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => {
      const point = await page.locator('.device-position').boundingBox();
      const map = await page.getByRole('region', { name: 'Mapa de ubicaciones' }).boundingBox();
      return !!point && !!map && point.x >= map.x && point.y >= map.y
        && point.x + point.width <= map.x + map.width && point.y + point.height <= map.y + map.height;
    }).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/mapa-mobile.png', fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    const restored = await request.put(zoneUrl, { data: original });
    expect(restored.status()).toBe(200);
  }
});
