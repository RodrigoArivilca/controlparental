import { defineConfig } from '@playwright/test';

// No inicia ni simula servidores. Requiere el backend aislado y Angular activos.
export default defineConfig({
  testDir: './integration',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://localhost:4200', channel: 'msedge', headless: true },
});
