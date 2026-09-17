import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AlertsApi, type CreateRuleDto, type InjectEventDto } from './alerts-api';

describe('AlertsApi', () => {
  let api: AlertsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(AlertsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('injectEvent POSTs the dto to /api/events', () => {
    const dto: InjectEventDto = { type: 'news', severity: 2, title: 'T', summary: 'S', tags: ['a'] };

    api.injectEvent(dto).subscribe();

    const req = http.expectOne('/api/events');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ event: { id: 'e1' }, deliveries: [] });
  });

  it('listDeliveries GETs /api/deliveries', () => {
    let rows: unknown;

    api.listDeliveries().subscribe((result) => (rows = result));

    const req = http.expectOne('/api/deliveries');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    expect(rows).toEqual([]);
  });

  it('listChannels GETs /api/channels', () => {
    let ids: unknown;

    api.listChannels().subscribe((result) => (ids = result));

    const req = http.expectOne('/api/channels');
    expect(req.request.method).toBe('GET');
    req.flush(['email', 'slack']);
    expect(ids).toEqual(['email', 'slack']);
  });

  it('listUsers GETs /api/users', () => {
    let users: unknown;

    api.listUsers().subscribe((result) => (users = result));

    const req = http.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 'u1', name: 'Anna', email: 'anna@example.com', rules: [] }]);
    expect(users).toEqual([{ id: 'u1', name: 'Anna', email: 'anna@example.com', rules: [] }]);
  });

  it('createRule POSTs the dto to /api/rules', () => {
    const dto: CreateRuleDto = {
      userId: 'u1',
      eventTypes: ['news'],
      minSeverity: 1,
      keywords: ['election'],
      channels: ['slack'],
    };

    api.createRule(dto).subscribe();

    const req = http.expectOne('/api/rules');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 'r1', ...dto, createdAt: '2026-09-16T10:00:00.000Z' });
  });

  it('deleteRule sends DELETE to /api/rules/:id', () => {
    let completed = false;

    api.deleteRule('r1').subscribe({ complete: () => (completed = true) });

    const req = http.expectOne('/api/rules/r1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(completed).toBe(true);
  });
});
