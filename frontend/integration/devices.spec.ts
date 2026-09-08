import { expect, test } from '@playwright/test';

test('Angular muestra los dispositivos de la API real mediante el proxy', async ({ page, request }) => {
  const api = await request.get('/api/v1/devices');
  expect(api.status()).toBe(200);
  const devices = await api.json() as Array<{ id: string; deviceName: string }>;
  expect(Array.isArray(devices)).toBe(true);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith('/api/v1/devices') && response.request().method() === 'GET');
  await page.goto('/');
  expect((await responsePromise).status()).toBe(200);
  await expect(page).toHaveURL(/\/dispositivos$/);
  await expect(page.getByRole('heading', { name: 'Dispositivos', exact: true })).toBeVisible();
  await expect(page.locator('.device-card')).toHaveCount(devices.length);
  if (devices.length === 0) {
    await expect(page.getByText('Aún no hay dispositivos')).toBeVisible();
  } else {
    for (const device of devices) {
      const card = page.locator('.device-card').filter({ hasText: device.id });
      await expect(card.getByRole('heading')).toHaveText(device.deviceName);
    }
  }
  await page.screenshot({ path: 'test-results/dispositivos-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Actualizar' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/dispositivos-mobile.png', fullPage: true });
});
