import { EVENT_TYPES } from './event-type.js';
import { matchesRule, type MatchableEvent, type MatchableRule } from './match-rule.js';

function event(overrides: Partial<MatchableEvent> = {}): MatchableEvent {
  return {
    type: 'news',
    severity: 3,
    title: 'Something happened',
    summary: 'Details follow.',
    tags: [],
    ...overrides,
  };
}

function rule(overrides: Partial<MatchableRule> = {}): MatchableRule {
  return { eventTypes: [], minSeverity: 1, keywords: [], ...overrides };
}

describe('matchesRule', () => {
  describe('event type', () => {
    it('returns false when the type is not in eventTypes', () => {
      expect(matchesRule(event({ type: 'news' }), rule({ eventTypes: ['market'] }))).toBe(false);
    });

    it('lets any type pass when eventTypes is empty', () => {
      for (const type of EVENT_TYPES) {
        expect(matchesRule(event({ type }), rule({ eventTypes: [] }))).toBe(true);
      }
    });
  });

  describe('severity', () => {
    it('returns true when severity equals minSeverity', () => {
      expect(matchesRule(event({ severity: 3 }), rule({ minSeverity: 3 }))).toBe(true);
    });

    it('returns false when severity is one below minSeverity', () => {
      expect(matchesRule(event({ severity: 2 }), rule({ minSeverity: 3 }))).toBe(false);
    });
  });

  describe('keywords', () => {
    it('matches the title case-insensitively', () => {
      expect(matchesRule(event({ title: 'Flood warning issued' }), rule({ keywords: ['FLOOD'] }))).toBe(true);
    });

    it('matches the summary case-insensitively', () => {
      expect(
        matchesRule(event({ summary: 'River levels near a record FLOOD mark.' }), rule({ keywords: ['flood'] })),
      ).toBe(true);
    });

    it('matches a tag equal to the keyword, case-insensitively', () => {
      expect(matchesRule(event({ tags: ['Energy'] }), rule({ keywords: ['energy'] }))).toBe(true);
    });

    it('does not match "rate" inside "corporate"', () => {
      expect(matchesRule(event({ title: 'Corporate earnings beat forecasts' }), rule({ keywords: ['rate'] }))).toBe(
        false,
      );
    });

    it('matches "interest rate" in "Interest Rate hike"', () => {
      expect(matchesRule(event({ title: 'Interest Rate hike' }), rule({ keywords: ['interest rate'] }))).toBe(true);
    });

    it('matches accented text: "árvíz" in "Árvíz a Dunán"', () => {
      expect(matchesRule(event({ title: 'Árvíz a Dunán' }), rule({ keywords: ['árvíz'] }))).toBe(true);
    });

    it('matches a decomposed (NFD) title against a precomposed keyword', () => {
      const title = 'Árvíz a Dunán';
      expect(matchesRule(event({ title }), rule({ keywords: ['árvíz'] }))).toBe(true);
    });

    it('matches a decomposed (NFD) tag against a precomposed keyword', () => {
      expect(matchesRule(event({ tags: ['árvíz'] }), rule({ keywords: ['árvíz'] }))).toBe(true);
    });

    it('applies no keyword filter when keywords is empty', () => {
      expect(matchesRule(event({ title: 'Anything at all' }), rule({ keywords: [] }))).toBe(true);
    });
  });

  describe('all conditions together', () => {
    const matching = event({ type: 'market', severity: 4, title: 'Interest rate decision' });
    const fullRule = rule({ eventTypes: ['market'], minSeverity: 4, keywords: ['interest rate'] });

    it('returns true when type, severity and keyword all hold', () => {
      expect(matchesRule(matching, fullRule)).toBe(true);
    });

    it('returns false when only the type fails', () => {
      expect(matchesRule({ ...matching, type: 'news' }, fullRule)).toBe(false);
    });

    it('returns false when only the severity fails', () => {
      expect(matchesRule({ ...matching, severity: 3 }, fullRule)).toBe(false);
    });

    it('returns false when only the keyword fails', () => {
      expect(matchesRule({ ...matching, title: 'Quarterly results' }, fullRule)).toBe(false);
    });
  });
});
