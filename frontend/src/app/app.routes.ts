import { Routes } from '@angular/router';

import { authGuard } from './auth/auth-service';

export const routes: Routes = [

  {
    path: 'login',
    title: 'Iniciar sesión | SaludPlus',
    loadComponent: () =>
      import('./auth/login-page')
        .then((m) => m.LoginPage),
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dispositivos',
  },

  {
    path: 'dispositivos',
    title: 'Dispositivos | SaludPlus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./devices/devices-page')
        .then((m) => m.DevicesPage),
  },

  {
    path: 'usuarios',
    title: 'Usuarios | SaludPlus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./users/users-page')
        .then((m) => m.UsersPage),
  },

  {
    path: 'llamadas',
    title: 'Registro de llamadas | SaludPlus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./calls/calls-page')
        .then((m) => m.CallsPage),
  },

  {
    path: 'uso-aplicaciones',
    title: 'Uso de aplicaciones | SaludPlus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./app-usage/app-usage-page')
        .then((m) => m.AppUsagePage),
  },

  {
    path: 'mapa',
    title: 'Mapa y ubicaciones | SaludPlus',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./map/map-page')
        .then((m) => m.MapPage),
  },

  {
    path: '**',
    redirectTo: 'dispositivos',
  },

];
