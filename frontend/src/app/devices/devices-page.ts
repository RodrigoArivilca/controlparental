import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DeviceService } from './device-service';
import { Device } from './device';

type DevicesState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; devices: Device[] };

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './devices-page.html',
  styleUrl: './devices-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesPage {
  private readonly service = inject(DeviceService);
  private readonly destroyRef = inject(DestroyRef);
  readonly state = signal<DevicesState>({ status: 'loading' });

  constructor() { this.loadDevices(); }

  loadDevices(): void {
    this.state.set({ status: 'loading' });
    this.service.getDevices().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (devices) => this.state.set({ status: 'loaded', devices }),
      error: () => this.state.set({ status: 'error' }),
    });
  }

  roleLabel(role: string | null): string {
    if (role?.toUpperCase() === 'ADMIN') return 'Administrador';
    if (role?.toUpperCase() === 'CONTROLLED') return 'Supervisado';
    return role || 'Sin rol';
  }
}
