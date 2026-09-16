import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlertsApi, EVENT_TYPES, type EventType } from './alerts-api';

export function wholeNumber(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return value === null || value === '' || Number.isInteger(value) ? null : { wholeNumber: true };
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

@Component({
  selector: 'app-inject-event-form',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './inject-event-form.html',
  styleUrl: './inject-event-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InjectEventForm {
  private readonly api = inject(AlertsApi);

  readonly created = output<number>();

  protected readonly eventTypes = EVENT_TYPES;
  protected readonly submitting = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly createdCount = signal<number | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    type: ['' as EventType | '', Validators.required],
    severity: [3, [Validators.required, wholeNumber, Validators.min(1), Validators.max(5)]],
    title: ['', Validators.required],
    summary: ['', Validators.required],
    tags: [''],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.clearMessages());
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    if (this.form.invalid) {
      this.clearMessages();
      this.form.markAllAsTouched();
      return;
    }

    const { type, severity, title, summary, tags } = this.form.getRawValue();
    this.submitting.set(true);
    this.clearMessages();

    this.api.injectEvent({ type: type as EventType, severity, title, summary, tags: parseTags(tags) }).subscribe({
      next: (response) => {
        this.submitting.set(false);
        this.createdCount.set(response.deliveries.length);
        this.created.emit(response.deliveries.length);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errors.set(errorMessages(err));
      },
    });
  }

  private clearMessages(): void {
    this.errors.set([]);
    this.createdCount.set(null);
  }
}

function errorMessages(err: HttpErrorResponse): string[] {
  const message: unknown = err.status === 400 ? (err.error as { message?: unknown } | null)?.message : undefined;
  if (Array.isArray(message)) {
    return message.map(String);
  }
  if (typeof message === 'string') {
    return [message];
  }
  return [`Request failed (${err.status || 'network error'})`];
}
