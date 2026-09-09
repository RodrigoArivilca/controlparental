import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallDevice, CallLog } from './call';
import { CallService } from './call-service';

@Component({
  selector: 'app-calls-page',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe
  ],
  templateUrl: './calls-page.html',
  styleUrl: './calls-page.css',
})
export class CallsPage {

  private readonly service = inject(CallService);

  readonly devices = signal<CallDevice[]>([]);
  readonly calls = signal<CallLog[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  selectedDeviceId = '';

  constructor() {
    this.loadDevices();
  }

  loadDevices(): void {

    this.service.getDevices().subscribe({

      next: (devices) => {

        this.devices.set(devices);

        if (devices.length > 0) {
          this.selectedDeviceId = devices[0].id;
          this.loadCalls();
        }
      },

      error: () => {
        this.error.set('No se pudieron cargar los dispositivos.');
      }
    });
  }

  loadCalls(): void {

    if (!this.selectedDeviceId) {
      this.calls.set([]);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.service
      .getCalls(this.selectedDeviceId)
      .subscribe({

        next: (calls) => {
          this.calls.set(calls);
          this.loading.set(false);
        },

        error: () => {
          this.calls.set([]);
          this.loading.set(false);
          this.error.set(
            'No se pudo cargar el historial de llamadas.'
          );
        }
      });
  }

  callTypeLabel(type: string | null): string {

    switch (type) {

      case 'INCOMING':
        return 'Entrante';

      case 'OUTGOING':
        return 'Saliente';

      case 'MISSED':
        return 'Perdida';

      case 'WHATSAPP':
        return 'WhatsApp';

      default:
        return type ?? 'Sin tipo';
    }
  }

  formatDuration(seconds: number | null): string {

    if (seconds === null || seconds === undefined) {
      return '-';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes} min ${remainingSeconds} s`;
  }
}