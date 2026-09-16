export const EVENT_TYPES = ['news', 'market', 'disaster'] as const;

export type EventType = (typeof EVENT_TYPES)[number];
