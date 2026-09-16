import type { EventType } from './event-type.js';

export interface MatchableEvent {
  type: EventType;
  severity: number;
  title: string;
  summary: string;
  tags: string[];
}

export interface MatchableRule {
  eventTypes: EventType[];
  minSeverity: number;
  keywords: string[];
}

function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase();
}

function tokenize(text: string): string[] {
  return normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function containsSequence(tokens: string[], sequence: string[]): boolean {
  if (sequence.length === 0) return false;
  for (let start = 0; start + sequence.length <= tokens.length; start++) {
    if (sequence.every((token, i) => tokens[start + i] === token)) return true;
  }
  return false;
}

export function matchesRule(event: MatchableEvent, rule: MatchableRule): boolean {
  if (rule.eventTypes.length > 0 && !rule.eventTypes.includes(event.type)) {
    return false;
  }
  if (event.severity < rule.minSeverity) {
    return false;
  }
  if (rule.keywords.length === 0) {
    return true;
  }

  const titleTokens = tokenize(event.title);
  const summaryTokens = tokenize(event.summary);
  const tags = event.tags.map(normalize);

  return rule.keywords.some((keyword) => {
    const keywordTokens = tokenize(keyword);
    return (
      containsSequence(titleTokens, keywordTokens) ||
      containsSequence(summaryTokens, keywordTokens) ||
      tags.includes(normalize(keyword))
    );
  });
}
