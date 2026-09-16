import type { MatchableEvent } from './match-rule.js';
import { planDeliveries, type PlannableRule } from './plan-deliveries.js';

const event: MatchableEvent = {
  type: 'disaster',
  severity: 4,
  title: 'Árvíz a Dunán',
  summary: 'Rising water levels.',
  tags: ['flood'],
};

function rule(overrides: Partial<PlannableRule>): PlannableRule {
  return {
    id: 'rule',
    userId: 'user',
    eventTypes: [],
    minSeverity: 1,
    keywords: [],
    channels: ['email'],
    ...overrides,
  };
}

describe('planDeliveries', () => {
  it('plans one delivery with the first rule id when two rules of one user share a channel', () => {
    const rules = [
      rule({ id: 'r1', userId: 'u1', channels: ['email'] }),
      rule({ id: 'r2', userId: 'u1', channels: ['email'] }),
    ];

    expect(planDeliveries(event, rules)).toEqual([{ userId: 'u1', ruleId: 'r1', channel: 'email' }]);
  });

  it('plans two deliveries for the same user on different channels', () => {
    const rules = [
      rule({ id: 'r1', userId: 'u1', channels: ['email'] }),
      rule({ id: 'r2', userId: 'u1', channels: ['slack'] }),
    ];

    expect(planDeliveries(event, rules)).toEqual([
      { userId: 'u1', ruleId: 'r1', channel: 'email' },
      { userId: 'u1', ruleId: 'r2', channel: 'slack' },
    ]);
  });

  it('plans separate deliveries for two users', () => {
    const rules = [
      rule({ id: 'r1', userId: 'u1', channels: ['email'] }),
      rule({ id: 'r2', userId: 'u2', channels: ['email'] }),
    ];

    expect(planDeliveries(event, rules)).toEqual([
      { userId: 'u1', ruleId: 'r1', channel: 'email' },
      { userId: 'u2', ruleId: 'r2', channel: 'email' },
    ]);
  });

  it('returns an empty plan when no rule matches', () => {
    const rules = [
      rule({ id: 'r1', userId: 'u1', eventTypes: ['market'] }),
      rule({ id: 'r2', userId: 'u2', minSeverity: 5 }),
    ];

    expect(planDeliveries(event, rules)).toEqual([]);
  });
});
