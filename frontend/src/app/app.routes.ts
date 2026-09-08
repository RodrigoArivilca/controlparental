import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'mapa', title: 'Mapa y ubicaciones | SaludPlus', loadComponent: () => import('./map/map-page').then((m) => m.MapPage) },
  { path: '', pathMatch: 'full', redirectTo: 'dispositivos' },
  {
    path: 'dispositivos',
    title: 'Dispositivos | SaludPlus',
    loadComponent: () => import('./devices/devices-page').then((m) => m.DevicesPage),
  },
  { path: '**', redirectTo: 'dispositivos' },
];
