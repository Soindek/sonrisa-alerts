import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { DeliveryLogEntry, DeliveryStatus } from './alerts-api';
import { DeliveryLogTable } from './delivery-log-table';

function entry(id: string, status: DeliveryStatus, joins: Partial<DeliveryLogEntry> = {}): DeliveryLogEntry {
  return Object.assign(
    {
      id,
      eventId: 'e1',
      userId: 'u1',
      ruleId: 'r1',
      channel: 'email',
      status,
      error: status === 'failed' ? 'boom' : null,
      createdAt: '2026-09-16T10:00:00.000Z',
      event: { title: 'Flood warning', type: 'disaster' as const, severity: 4 },
      user: { name: 'Anna Kiss', email: 'anna@example.com' },
    },
    joins,
  );
}

describe('DeliveryLogTable', () => {
  let fixture: ComponentFixture<DeliveryLogTable>;
  let http: HttpTestingController;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texts(selector: string): string[] {
    return [...element().querySelectorAll(selector)].map((node) => node.textContent?.trim() ?? '');
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [DeliveryLogTable],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(DeliveryLogTable);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('gives each status its own CSS class', async () => {
    http.expectOne('/api/deliveries').flush([entry('d1', 'sent'), entry('d2', 'dry-run'), entry('d3', 'failed')]);
    await fixture.whenStable();

    const statuses = [...element().querySelectorAll('.status')].map((node) => [node.textContent?.trim(), node.className]);
    expect(statuses).toEqual([
      ['sent', 'status status-sent'],
      ['dry-run', 'status status-dry-run'],
      ['failed', 'status status-failed'],
    ]);
  });

  it('shows "unknown event" and "unknown user" for null joins', async () => {
    http
      .expectOne('/api/deliveries')
      .flush([entry('d1', 'sent', { event: null }), entry('d2', 'sent', { user: null })]);
    await fixture.whenStable();

    expect(texts('.missing')).toEqual(['unknown event', 'unknown user']);
    expect(texts('td.mat-column-event')).toEqual(['unknown event', 'disaster · sev 4 · Flood warning']);
    expect(texts('td.mat-column-user')).toEqual(['Anna Kiss', 'unknown user']);
  });

  it('shows a load error when the request fails', async () => {
    http.expectOne('/api/deliveries').flush('down', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(texts('.load-error')).toEqual(['Could not load deliveries']);
  });

  it('re-fetches when Refresh is clicked', async () => {
    http.expectOne('/api/deliveries').flush([]);
    await fixture.whenStable();

    element().querySelector<HTMLButtonElement>('.toolbar button')!.click();
    await fixture.whenStable();

    http.expectOne('/api/deliveries').flush([entry('d1', 'sent')]);
    await fixture.whenStable();
    expect(texts('.status')).toEqual(['sent']);
  });

  it('cancels an in-flight load when a newer refresh starts', async () => {
    const first = http.expectOne('/api/deliveries');

    fixture.componentInstance.refresh();

    expect(first.cancelled).toBe(true);
    http.expectOne('/api/deliveries').flush([entry('d1', 'failed')]);
    await fixture.whenStable();
    expect(texts('.status')).toEqual(['failed']);
  });
});
