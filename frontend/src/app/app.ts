import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs';
import { AuthService } from './auth/auth-service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly isLoginPage = signal(false);
  readonly currentUser = this.authService.currentUser;

  constructor() {

    this.updateRoute(this.router.url);

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd =>
            event instanceof NavigationEnd
        )
      )
      .subscribe((event) => {
        this.updateRoute(event.urlAfterRedirects);
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private updateRoute(url: string): void {
    this.isLoginPage.set(
      url === '/login' || url.startsWith('/login?')
    );
  }
}
