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

  function texts(selector: string): string[] {
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll(selector)].map(
      (node) => node.textContent?.trim() ?? '',
    );
  }

  async function respondWith(deliveryCount: number) {
    const deliveries = Array.from({ length: deliveryCount }, (_, i) => ({ id: `d${i}` }));
    http.expectOne('/api/events').flush({ event: { id: 'e1' }, deliveries });
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

  it('does not submit a severity that is not a whole number', async () => {
    fill({ severity: 2.5 });

    await clickSubmit();

    http.expectNone('/api/events');
    expect(texts('mat-error')).toEqual(['Severity must be a whole number']);
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

  it('shows the result message and emits created on success', async () => {
    const created = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    fill();

    await clickSubmit();
    await respondWith(2);

    expect(texts('.success')).toEqual(['Event created, 2 deliveries.']);
    expect(created).toHaveBeenCalledExactlyOnceWith(2);
  });

  it.each([
    [0, 'Event created, 0 deliveries.'],
    [1, 'Event created, 1 delivery.'],
    [3, 'Event created, 3 deliveries.'],
  ])('uses singular or plural for %i deliveries', async (count, message) => {
    fill();

    await clickSubmit();
    await respondWith(count);

    expect(texts('.success')).toEqual([message]);
  });

  it('shows a fallback message for a 500 response', async () => {
    fill();
    await clickSubmit();

    http.expectOne('/api/events').flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(texts('.errors li')).toEqual(['Request failed (500)']);
  });

  it('clears the previous success or error message when the form value changes', async () => {
    fill();
    await clickSubmit();
    await respondWith(1);
    expect(texts('.success')).toHaveLength(1);

    fixture.componentInstance.form.controls.title.setValue('Another title');
    await fixture.whenStable();
    expect(texts('.success')).toEqual([]);

    await clickSubmit();
    http.expectOne('/api/events').flush({ message: ['title is bad'] }, { status: 400, statusText: 'Bad Request' });
    await fixture.whenStable();
    expect(texts('.errors li')).toEqual(['title is bad']);

    fixture.componentInstance.form.controls.summary.setValue('Changed summary');
    await fixture.whenStable();
    expect(texts('.errors li')).toEqual([]);
  });

  it('clears the previous message when a submit is attempted on an invalid form', async () => {
    fill();
    await clickSubmit();
    await respondWith(1);
    expect(texts('.success')).toHaveLength(1);

    // Bypass valueChanges so only the invalid submit can clear the message.
    fixture.componentInstance.form.controls.title.setValue('', { emitEvent: false });
    await clickSubmit();

    http.expectNone('/api/events');
    expect(texts('.success')).toEqual([]);
  });
});
