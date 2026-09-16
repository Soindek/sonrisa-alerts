import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlertsApi, EVENT_TYPES, type EventType } from './alerts-api';

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
    severity: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    title: ['', Validators.required],
    summary: ['', Validators.required],
    tags: [''],
  });

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const { type, severity, title, summary, tags } = this.form.getRawValue();
    this.submitting.set(true);
    this.errors.set([]);
    this.createdCount.set(null);

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
