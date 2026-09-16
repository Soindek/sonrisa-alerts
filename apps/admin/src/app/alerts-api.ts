import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export const EVENT_TYPES = ['news', 'market', 'disaster'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type DeliveryStatus = 'sent' | 'dry-run' | 'failed';

export interface InjectEventDto {
  type: EventType;
  severity: number;
  title: string;
  summary: string;
  tags: string[];
}

export interface Delivery {
  id: string;
  eventId: string;
  userId: string;
  ruleId: string;
  channel: string;
  status: DeliveryStatus;
  error: string | null;
  createdAt: string;
}

export interface InjectEventResponse {
  event: { id: string };
  deliveries: Delivery[];
}

export interface DeliveryLogEntry extends Delivery {
  event: { title: string; type: EventType; severity: number } | null;
  user: { name: string; email: string } | null;
}

@Injectable({ providedIn: 'root' })
export class AlertsApi {
  private readonly http = inject(HttpClient);

  injectEvent(dto: InjectEventDto): Observable<InjectEventResponse> {
    return this.http.post<InjectEventResponse>('/api/events', dto);
  }

  listDeliveries(): Observable<DeliveryLogEntry[]> {
    return this.http.get<DeliveryLogEntry[]>('/api/deliveries');
  }
}
