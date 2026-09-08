import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  id: number;
  nombres: string;
  apellidos: string;
  correo: string;
  rol: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly http = inject(HttpClient);
  private readonly storageKey = 'saludplus_user';

  readonly currentUser = signal<LoginResponse | null>(
    this.readStoredUser()
  );

  readonly loggedIn = computed(() => this.currentUser() !== null);

  login(correo: string, password: string): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      '/api/v1/auth/login',
      {
        correo,
        password,
      },
      {
        timeout: 10000,
      }
    ).pipe(
      tap((usuario) => {

        this.currentUser.set(usuario);

        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(
            this.storageKey,
            JSON.stringify(usuario)
          );
        }
      })
    );
  }

  logout(): void {

    this.currentUser.set(null);

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(this.storageKey);
    }
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  private readStoredUser(): LoginResponse | null {

    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const value = sessionStorage.getItem(this.storageKey);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as LoginResponse;
    } catch {
      sessionStorage.removeItem(this.storageKey);
      return null;
    }
  }
}

export const authGuard: CanActivateFn = () => {

  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};