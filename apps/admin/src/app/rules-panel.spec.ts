import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import type { AlertRule, UserWithRules } from './alerts-api';
import { RulesPanel } from './rules-panel';

function rule(id: string, overrides: Partial<AlertRule> = {}): AlertRule {
  return {
    id,
    userId: 'u1',
    eventTypes: [],
    minSeverity: 4,
    keywords: [],
    channels: ['email'],
    createdAt: '2026-09-16T10:00:00.000Z',
    ...overrides,
  };
}

const users: UserWithRules[] = [
  {
    id: 'u1',
    name: 'Anna',
    email: 'anna@example.com',
    rules: [
      rule('r1'),
      rule('r2', { eventTypes: ['disaster', 'news'], minSeverity: 3, keywords: ['árvíz', 'flood'], channels: ['email', 'slack'] }),
    ],
  },
  { id: 'u2', name: 'Bence', email: 'bence@example.com', rules: [] },
];

describe('RulesPanel', () => {
  let fixture: ComponentFixture<RulesPanel>;
  let http: HttpTestingController;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function texts(selector: string): string[] {
    return [...element().querySelectorAll(selector)].map((node) => node.textContent?.trim() ?? '');
  }

  function deleteButtons(): HTMLButtonElement[] {
    return [...element().querySelectorAll<HTMLButtonElement>('.rules .actions button')];
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [RulesPanel],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(RulesPanel);
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    http.expectOne('/api/channels').flush(['email', 'slack']);
    http.expectOne('/api/users').flush(users);
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
  });

  it('renders each rule, with "any" for no types and "—" for no keywords', () => {
    expect(texts('.user h3')).toEqual(['Anna anna@example.com', 'Bence bence@example.com']);
    expect(texts('.rules .types')).toEqual(['any', 'disaster, news']);
    expect(texts('.rules .severity')).toEqual(['4', '3']);
    expect(texts('.rules .keywords')).toEqual(['—', 'árvíz, flood']);
    expect(texts('.rules .channels')).toEqual(['email', 'email, slack']);
    expect(texts('.no-rules')).toEqual(['No rules.']);
  });

  it('deletes a rule and refreshes the list', async () => {
    deleteButtons()[1].click();
    await fixture.whenStable();

    const req = http.expectOne('/api/rules/r2');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    http.expectOne('/api/users').flush([{ ...users[0], rules: [rule('r1')] }, users[1]]);
    await fixture.whenStable();
    expect(texts('.rules .types')).toEqual(['any']);
  });

  it('shows the message of a failed delete and refreshes', async () => {
    deleteButtons()[0].click();
    await fixture.whenStable();

    http
      .expectOne('/api/rules/r1')
      .flush({ message: 'Rule not found: r1', statusCode: 404 }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();

    expect(texts('.delete-errors li')).toEqual(['Rule not found: r1']);
    http.expectOne('/api/users').flush(users);
  });

  it('shows a load error when the users request fails', async () => {
    fixture.componentInstance.refresh();
    http.expectOne('/api/users').flush('down', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(texts('.load-error')).toEqual(['Could not load rules']);
  });
});
