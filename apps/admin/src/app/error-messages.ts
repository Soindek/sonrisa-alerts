import type { HttpErrorResponse } from '@angular/common/http';

/** The API's own message for a 400 or 404, otherwise a generic fallback with the status. */
export function errorMessages(err: HttpErrorResponse): string[] {
  const message: unknown =
    err.status === 400 || err.status === 404 ? (err.error as { message?: unknown } | null)?.message : undefined;
  if (Array.isArray(message)) {
    return message.map(String);
  }
  if (typeof message === 'string') {
    return [message];
  }
  return [`Request failed (${err.status || 'network error'})`];
}
