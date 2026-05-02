import type { CampusNotificationType } from '../services/api';

const PRIORITY_MAP: Record<CampusNotificationType, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export interface SortableCampusNotification {
  Type: CampusNotificationType;
  Timestamp: string;
}

function parseTimestamp(timestamp: string): number {
  const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getPriorityScore(type: CampusNotificationType): number {
  return PRIORITY_MAP[type];
}

export function sortByPriority<T extends SortableCampusNotification>(notifications: T[]): T[] {
  return [...notifications].sort((left, right) => {
    const priorityDelta = getPriorityScore(right.Type) - getPriorityScore(left.Type);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return parseTimestamp(right.Timestamp) - parseTimestamp(left.Timestamp);
  });
}

export function selectTopPriority<T extends SortableCampusNotification>(notifications: T[], count: number): T[] {
  const normalizedCount = Math.max(1, Math.trunc(count) || 1);
  return sortByPriority(notifications).slice(0, normalizedCount);
}

export function formatCampusTimestamp(timestamp: string): string {
  const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  return parsed.toLocaleString();
}

export function formatRelativeCampusTime(timestamp: string, now: Date = new Date()): string {
  const normalized = timestamp.includes('T') ? timestamp : timestamp.replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return timestamp;
  }

  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return 'just now';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}