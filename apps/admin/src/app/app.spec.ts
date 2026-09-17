import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function tabLabels(): HTMLElement[] {
    return [...element().querySelectorAll<HTMLElement>('[role="tab"]')];
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(App);
    await fixture.whenStable();
  });

  it('should render title', () => {
    expect(element().querySelector('h1')?.textContent).toContain('Sonrisa alerts admin');
  });

  it('renders both tab labels', () => {
    expect(tabLabels().map((tab) => tab.textContent?.trim())).toEqual(['Events', 'Rules']);
  });

  it('shows the inject form and the delivery log on the Events tab', () => {
    expect(element().querySelector('app-inject-event-form')).not.toBeNull();
    expect(element().querySelector('app-delivery-log-table')).not.toBeNull();
    expect(element().querySelector('app-rules-panel')).toBeNull();
  });

  it('shows the rules panel after selecting the Rules tab', async () => {
    tabLabels()[1].click();
    await fixture.whenStable();

    expect(element().querySelector('app-rules-panel')).not.toBeNull();
  });
});
