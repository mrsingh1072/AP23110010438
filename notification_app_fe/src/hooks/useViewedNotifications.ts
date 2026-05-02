import { useEffect, useState } from 'react';

const READ_STORAGE_KEY = 'campus-notifications-read';

function readReadIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = window.localStorage.getItem(READ_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function useViewedNotifications() {
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(readReadIds()));

  useEffect(() => {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
  }, [readIds]);

  const markRead = (id: string) => {
    setReadIds((current) => {
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };

  const markUnread = (id: string) => {
    setReadIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const isRead = (id: string) => readIds.has(id);

  const clearRead = () => {
    setReadIds(new Set());
  };

  return {
    readIds,
    markRead,
    markUnread,
    isRead,
    clearRead,
  };
}