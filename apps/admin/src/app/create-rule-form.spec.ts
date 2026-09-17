import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { UserWithRules } from './alerts-api';
import { CreateRuleForm } from './create-rule-form';

const users: UserWithRules[] = [
  { id: 'u1', name: 'Anna', email: 'anna@example.com', rules: [] },
  { id: 'u2', name: 'Bence', email: 'bence@example.com', rules: [] },
];

describe('CreateRuleForm', () => {
  let fixture: ComponentFixture<CreateRuleForm>;
  let http: HttpTestingController;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texts(selector: string): string[] {
    return [...element().querySelectorAll(selector)].map((node) => node.textContent?.trim() ?? '');
  }

  function fill(overrides: Partial<ReturnType<CreateRuleForm['form']['getRawValue']>> = {}) {
    fixture.componentInstance.form.setValue({
      userId: 'u2',
      eventTypes: ['news'],
      minSeverity: 1,
      keywords: 'election',
      channels: ['slack'],
      ...overrides,
    });
  }

  async function clickSubmit() {
    element().querySelector<HTMLButtonElement>('button[type=submit]')!.click();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CreateRuleForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(CreateRuleForm);
    fixture.componentRef.setInput('users', users);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    http.expectOne('/api/channels').flush(['email', 'slack']);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('offers one checkbox per channel from the API', () => {
    expect(texts('mat-checkbox')).toEqual(['email', 'slack']);
  });

  it('says so when the channels cannot be loaded', async () => {
    const failing = TestBed.createComponent(CreateRuleForm);
    failing.componentRef.setInput('users', users);
    await failing.whenStable();

    http.expectOne('/api/channels').flush('boom', { status: 500, statusText: 'Server Error' });
    await failing.whenStable();

    const native = failing.nativeElement as HTMLElement;
    expect([...native.querySelectorAll('.field-error')].map((node) => node.textContent?.trim())).toEqual([
      'Could not load channels',
    ]);
    expect(native.querySelectorAll('mat-checkbox')).toHaveLength(0);
  });

  it('does not submit without a channel and says so', async () => {
    fill({ channels: [] });

    await clickSubmit();

    http.expectNone('/api/rules');
    expect(texts('.channel-required')).toEqual(['Select at least one channel']);
  });

  it('does not submit a min severity that is not a whole number', async () => {
    fill({ minSeverity: 2.5 });

    await clickSubmit();

    http.expectNone('/api/rules');
    expect(texts('mat-error')).toEqual(['Min severity must be a whole number']);
  });

  it('builds the channel list from the checkboxes', async () => {
    fill({ channels: [] });
    for (const input of element().querySelectorAll<HTMLInputElement>('mat-checkbox input')) {
      input.click();
    }
    await fixture.whenStable();

    expect(fixture.componentInstance.form.controls.channels.value).toEqual(['email', 'slack']);

    element().querySelector<HTMLInputElement>('mat-checkbox input')!.click();
    await fixture.whenStable();
    expect(fixture.componentInstance.form.controls.channels.value).toEqual(['slack']);
  });

  it('splits keywords, trims entries and drops empty ones', async () => {
    fill({ keywords: ' election , ,interest rate,, ', eventTypes: [] });

    await clickSubmit();

    const req = http.expectOne('/api/rules');
    expect(req.request.body).toEqual({
      userId: 'u2',
      eventTypes: [],
      minSeverity: 1,
      keywords: ['election', 'interest rate'],
      channels: ['slack'],
    });
    req.flush({ id: 'r1' });
  });

  it('shows a success message, resets the form and emits created', async () => {
    const created = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    fill();

    await clickSubmit();
    http.expectOne('/api/rules').flush({ id: 'r1' });
    await fixture.whenStable();

    expect(texts('.success')).toEqual(['Rule created.']);
    expect(fixture.componentInstance.form.controls.userId.value).toBe('');
    expect(created).toHaveBeenCalledOnce();
  });

  it('shows no validation errors on the form reset after a successful create', async () => {
    fill();

    await clickSubmit();
    http.expectOne('/api/rules').flush({ id: 'r1' });
    await fixture.whenStable();

    expect(texts('.success')).toEqual(['Rule created.']);
    expect(element().querySelectorAll('mat-error')).toHaveLength(0);
  });

  it('renders the message of a 400 response', async () => {
    fill();
    await clickSubmit();

    http
      .expectOne('/api/rules')
      .flush(
        { message: 'Unknown channels: sms', error: 'Bad Request', statusCode: 400 },
        { status: 400, statusText: 'Bad Request' },
      );
    await fixture.whenStable();

    expect(texts('.errors li')).toEqual(['Unknown channels: sms']);
  });

  it('renders the message of a 404 response', async () => {
    fill();
    await clickSubmit();

    http
      .expectOne('/api/rules')
      .flush(
        { message: 'User not found: u2', error: 'Not Found', statusCode: 404 },
        { status: 404, statusText: 'Not Found' },
      );
    await fixture.whenStable();

    expect(texts('.errors li')).toEqual(['User not found: u2']);
  });

  it('shows a fallback message for a 500 response', async () => {
    fill();
    await clickSubmit();

    http.expectOne('/api/rules').flush('boom', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(texts('.errors li')).toEqual(['Request failed (500)']);
  });
});
