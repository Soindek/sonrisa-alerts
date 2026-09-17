import type { AbstractControl, ValidationErrors } from '@angular/forms';

export function wholeNumber(control: AbstractControl): ValidationErrors | null {
  const value: unknown = control.value;
  return value === null || value === '' || Number.isInteger(value) ? null : { wholeNumber: true };
}

export function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}
