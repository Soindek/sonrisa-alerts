import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { AlertsApi, type DeliveryLogEntry } from './alerts-api';

@Component({
  selector: 'app-delivery-log-table',
  imports: [DatePipe, MatTableModule, MatButtonModule],
  templateUrl: './delivery-log-table.html',
  styleUrl: './delivery-log-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryLogTable implements OnInit {
  private readonly api = inject(AlertsApi);

  protected readonly columns = ['time', 'event', 'user', 'channel', 'status', 'error'];
  protected readonly rows = signal<DeliveryLogEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading.set(true);
    this.api.listDeliveries().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loadError.set(null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Could not load deliveries');
        this.loading.set(false);
      },
    });
  }
}
