import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { Subject, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { AlertsApi, type DeliveryLogEntry } from './alerts-api';

@Component({
  selector: 'app-delivery-log-table',
  imports: [DatePipe, MatTableModule, MatButtonModule],
  templateUrl: './delivery-log-table.html',
  styleUrl: './delivery-log-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliveryLogTable {
  private readonly api = inject(AlertsApi);
  private readonly refreshes = new Subject<void>();

  protected readonly columns = ['time', 'event', 'user', 'channel', 'status', 'error'];
  protected readonly rows = signal<DeliveryLogEntry[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    // switchMap drops an in-flight load when a newer refresh starts, so a stale response never wins.
    this.refreshes
      .pipe(
        startWith(undefined),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.api.listDeliveries().pipe(
            map((rows) => ({ rows, error: null })),
            catchError(() => of({ rows: null, error: 'Could not load deliveries' })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ rows, error }) => {
        if (rows) {
          this.rows.set(rows);
        }
        this.loadError.set(error);
        this.loading.set(false);
      });
  }

  refresh(): void {
    this.refreshes.next();
  }
}
