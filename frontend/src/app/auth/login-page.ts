import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth-service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  correo = '';
  password = '';

  readonly loading = signal(false);
  readonly error = signal('');

  login(): void {

    if (!this.correo || !this.password) {
      this.error.set('Ingrese correo y contraseña.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.login(
      this.correo,
      this.password
    ).subscribe({

      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dispositivos']);
      },

      error: (err) => {

        this.loading.set(false);

        if (err.status === 401) {
          this.error.set('Correo o contraseña incorrectos.');
        } else {
          this.error.set('No se pudo conectar con SaludPlus.');
        }
      }
    });
  }
}