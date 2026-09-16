import { matchesRule, type MatchableEvent, type MatchableRule } from './match-rule.js';

export interface PlannableRule extends MatchableRule {
  id: string;
  userId: string;
  channels: string[];
}

export interface PlannedDelivery {
  userId: string;
  ruleId: string;
  channel: string;
}

/**
 * One delivery per (userId, channel). Rules are evaluated in the given order,
 * so the first matching rule wins the ruleId and the output order is stable.
 */
export function planDeliveries(event: MatchableEvent, rules: PlannableRule[]): PlannedDelivery[] {
  const seen = new Set<string>();
  const planned: PlannedDelivery[] = [];

  for (const rule of rules) {
    if (!matchesRule(event, rule)) continue;
    for (const channel of rule.channels) {
      const key = JSON.stringify([rule.userId, channel]);
      if (seen.has(key)) continue;
      seen.add(key);
      planned.push({ userId: rule.userId, ruleId: rule.id, channel });
    }
  }

  return planned;
}
