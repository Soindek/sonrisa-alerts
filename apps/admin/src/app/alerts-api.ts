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

export interface AlertRule {
  id: string;
  userId: string;
  eventTypes: EventType[];
  minSeverity: number;
  keywords: string[];
  channels: string[];
  createdAt: string;
}

export interface UserWithRules {
  id: string;
  name: string;
  email: string;
  rules: AlertRule[];
}

export type CreateRuleDto = Pick<AlertRule, 'userId' | 'eventTypes' | 'minSeverity' | 'keywords' | 'channels'>;

@Injectable({ providedIn: 'root' })
export class AlertsApi {
  private readonly http = inject(HttpClient);

  injectEvent(dto: InjectEventDto): Observable<InjectEventResponse> {
    return this.http.post<InjectEventResponse>('/api/events', dto);
  }

  listDeliveries(): Observable<DeliveryLogEntry[]> {
    return this.http.get<DeliveryLogEntry[]>('/api/deliveries');
  }

  listChannels(): Observable<string[]> {
    return this.http.get<string[]>('/api/channels');
  }

  listUsers(): Observable<UserWithRules[]> {
    return this.http.get<UserWithRules[]>('/api/users');
  }

  createRule(dto: CreateRuleDto): Observable<AlertRule> {
    return this.http.post<AlertRule>('/api/rules', dto);
  }

  deleteRule(id: string): Observable<void> {
    return this.http.delete<void>(`/api/rules/${encodeURIComponent(id)}`);
  }
}
