import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { Subject, catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { AlertsApi, type UserWithRules } from './alerts-api';
import { CreateRuleForm } from './create-rule-form';
import { errorMessages } from './error-messages';

@Component({
  selector: 'app-rules-panel',
  imports: [MatButtonModule, CreateRuleForm],
  templateUrl: './rules-panel.html',
  styleUrl: './rules-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesPanel {
  private readonly api = inject(AlertsApi);
  private readonly refreshes = new Subject<void>();

  protected readonly users = signal<UserWithRules[]>([]);
  protected readonly loading = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly deletingId = signal<string | null>(null);
  protected readonly deleteErrors = signal<string[]>([]);

  constructor() {
    // Same pattern as the delivery log: switchMap drops an in-flight load when a newer refresh starts.
    this.refreshes
      .pipe(
        startWith(undefined),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.api.listUsers().pipe(
            map((users) => ({ users, error: null })),
            catchError(() => of({ users: null, error: 'Could not load rules' })),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe(({ users, error }) => {
        if (users) {
          this.users.set(users);
        }
        this.loadError.set(error);
        this.loading.set(false);
      });
  }

  refresh(): void {
    this.refreshes.next();
  }

  protected deleteRule(id: string): void {
    if (this.deletingId()) {
      return;
    }
    this.deletingId.set(id);
    this.deleteErrors.set([]);

    this.api.deleteRule(id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.refresh();
      },
      error: (err: HttpErrorResponse) => {
        this.deletingId.set(null);
        this.deleteErrors.set(errorMessages(err));
        this.refresh();
      },
    });
  }
}
