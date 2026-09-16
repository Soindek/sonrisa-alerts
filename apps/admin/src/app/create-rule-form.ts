import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AlertsApi, EVENT_TYPES, type EventType, type UserWithRules } from './alerts-api';
import { errorMessages } from './error-messages';
import { parseTags, wholeNumber } from './inject-event-form';

@Component({
  selector: 'app-create-rule-form',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './create-rule-form.html',
  styleUrl: './create-rule-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateRuleForm {
  private readonly api = inject(AlertsApi);

  readonly users = input.required<UserWithRules[]>();
  readonly created = output<void>();

  protected readonly eventTypes = EVENT_TYPES;
  protected readonly channelIds = signal<string[]>([]);
  protected readonly channelsError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly errors = signal<string[]>([]);
  protected readonly success = signal(false);

  readonly form = inject(NonNullableFormBuilder).group({
    userId: ['', Validators.required],
    eventTypes: [[] as EventType[]],
    minSeverity: [1, [Validators.required, wholeNumber, Validators.min(1), Validators.max(5)]],
    keywords: [''],
    channels: [[] as string[], Validators.required],
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.clearMessages());
    // The offered channels come from the API, so a newly registered channel shows up without UI changes.
    this.api
      .listChannels()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (ids) => this.channelIds.set(ids),
        error: () => this.channelsError.set('Could not load channels'),
      });
  }

  protected isChannelSelected(id: string): boolean {
    return this.form.controls.channels.value.includes(id);
  }

  protected toggleChannel(id: string, checked: boolean): void {
    const control = this.form.controls.channels;
    const others = control.value.filter((channel) => channel !== id);
    control.setValue(checked ? [...others, id] : others);
    control.markAsTouched();
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

    const { userId, eventTypes, minSeverity, keywords, channels } = this.form.getRawValue();
    this.submitting.set(true);
    this.clearMessages();

    this.api.createRule({ userId, eventTypes, minSeverity, keywords: parseTags(keywords), channels }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.form.reset();
        this.success.set(true);
        this.created.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errors.set(errorMessages(err));
      },
    });
  }

  private clearMessages(): void {
    this.errors.set([]);
    this.success.set(false);
  }
}
