import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AlertsApi, type InjectEventDto } from './alerts-api';

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
});
