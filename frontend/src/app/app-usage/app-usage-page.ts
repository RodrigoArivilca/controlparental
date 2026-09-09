import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppUsage, UsageDevice } from './app-usage';
import { AppUsageService } from './app-usage-service';

@Component({
  selector: 'app-app-usage-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './app-usage-page.html',
  styleUrl: './app-usage-page.css',
})
export class AppUsagePage {

  private readonly service = inject(AppUsageService);

  readonly devices = signal<UsageDevice[]>([]);
  readonly usages = signal<AppUsage[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  selectedDeviceId = '';
  selectedDate = '';

  constructor() {
    this.loadDevices();
  }

  loadDevices(): void {

    this.service.getDevices().subscribe({

      next: (devices) => {

        this.devices.set(devices);

        if (devices.length > 0) {
          this.selectedDeviceId = devices[0].id;
          this.loadUsage();
        }
      },

      error: () => {
        this.error.set(
          'No se pudieron cargar los dispositivos.'
        );
      }
    });
  }

  loadUsage(): void {

    if (!this.selectedDeviceId) {
      this.usages.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const request = this.selectedDate
      ? this.service.getUsageByDate(
          this.selectedDeviceId,
          this.selectedDate
        )
      : this.service.getUsage(
          this.selectedDeviceId
        );

    request.subscribe({

      next: (usages) => {
        this.usages.set(usages);
        this.loading.set(false);
      },

      error: () => {
        this.usages.set([]);
        this.loading.set(false);
        this.error.set(
          'No se pudo cargar el uso de aplicaciones.'
        );
      }
    });
  }

  clearDate(): void {
    this.selectedDate = '';
    this.loadUsage();
  }

  totalUsageSeconds(): number {
    return this.usages()
      .reduce(
        (total, usage) =>
          total + usage.usageSeconds,
        0
      );
  }

  formatDuration(seconds: number): string {

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(
      (seconds % 3600) / 60
    );

    if (hours > 0) {
      return `${hours} h ${minutes} min`;
    }

    return `${minutes} min`;
  }
}