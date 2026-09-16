import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { InjectEventForm, parseTags } from './inject-event-form';

describe('InjectEventForm', () => {
  let fixture: ComponentFixture<InjectEventForm>;
  let http: HttpTestingController;

  function fill(overrides: Partial<ReturnType<InjectEventForm['form']['getRawValue']>> = {}) {
    fixture.componentInstance.form.setValue({
      type: 'market',
      severity: 3,
      title: 'Interest rate hike',
      summary: 'The central bank raised rates.',
      tags: '',
      ...overrides,
    });
  }

  async function clickSubmit() {
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [InjectEventForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(InjectEventForm);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('does not submit when severity is out of range', async () => {
    fill({ severity: 6 });

    await clickSubmit();

    http.expectNone('/api/events');
    expect(fixture.componentInstance.form.controls.severity.hasError('max')).toBe(true);
  });

  it('splits the tags string, trims entries and drops empty ones', async () => {
    expect(parseTags(' flood , ,budapest,, ')).toEqual(['flood', 'budapest']);

    fill({ tags: ' flood , ,budapest,, ' });
    await clickSubmit();

    const req = http.expectOne('/api/events');
    expect(req.request.body).toMatchObject({ tags: ['flood', 'budapest'] });
    req.flush({ event: { id: 'e1' }, deliveries: [] });
  });

  it('renders the messages of a 400 response', async () => {
    fill();
    await clickSubmit();

    http
      .expectOne('/api/events')
      .flush(
        { message: ['severity must not be greater than 5', 'title should not be empty'], statusCode: 400 },
        { status: 400, statusText: 'Bad Request' },
      );
    await fixture.whenStable();

    const items = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.errors li')].map((li) =>
      li.textContent?.trim(),
    );
    expect(items).toEqual(['severity must not be greater than 5', 'title should not be empty']);
  });
});
