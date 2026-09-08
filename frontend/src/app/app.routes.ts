import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dispositivos' },
  {
    path: 'dispositivos',
    title: 'Dispositivos | SaludPlus',
    loadComponent: () => import('./devices/devices-page').then((m) => m.DevicesPage),
  },
  { path: '**', redirectTo: 'dispositivos' },
];
