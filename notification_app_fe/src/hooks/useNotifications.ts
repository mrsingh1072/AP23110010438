import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Log } from '../../../logging_middleware/log';
import {
  createNotification,
  fetchNotificationPage,
  fetchNotifications as fetchLegacyNotifications,
  type CampusNotification,
  type NotificationFilter,
  type NotificationPayload,
  type NotificationRecord,
} from '../services/api';

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__CAMPUS_ACCESS_TOKEN__ ?? null;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
}

interface UseNotificationsResult {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
  limit: number;
  setLimit: Dispatch<SetStateAction<number>>;
  fetchNotifications: () => Promise<void>;
}

interface LegacyNotificationsResult {
  notifications: NotificationRecord[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  submitNotification: (payload: NotificationPayload) => Promise<NotificationRecord>;
}

function mapNotifications(items: CampusNotification[]): Notification[] {
  return items.map((item) => ({
    id: item.ID,
    title: item.Type,
    message: item.Message,
    isRead: false,
  }));
}

export function useNotifications(isAuthenticated: boolean): LegacyNotificationsResult;
export function useNotifications(notificationType?: NotificationFilter): UseNotificationsResult;
export function useNotifications(mode?: boolean | NotificationFilter): UseNotificationsResult | LegacyNotificationsResult {
  const isLegacyMode = typeof mode === 'boolean';
  const notificationType = isLegacyMode ? 'All' : mode ?? 'All';

  const [legacyNotifications, setLegacyNotifications] = useState<NotificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [legacyError, setLegacyError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();

    if (!token) {
      setNotifications([]);
      setError('A bearer token is required before loading notifications.');
      return;
    }

    setLoading(true);
    setError(null);

    void Log('frontend', 'info', 'api', 'Fetching notifications');

    try {
      const items = await fetchNotificationPage(token, {
        page,
        limit,
        notificationType,
      });

      const mapped = mapNotifications(items);
      setNotifications(mapped);

      if (mapped.length === 0) {
        void Log('frontend', 'warn', 'api', 'No notifications returned');
      } else {
        void Log('frontend', 'info', 'api', 'Notifications fetched successfully');
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to fetch notifications.';
      setError(message);
      setNotifications([]);
      void Log('frontend', 'error', 'api', 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [limit, notificationType, page]);

  const refreshNotifications = useCallback(async () => {
    if (!isLegacyMode || !mode) {
      setLegacyNotifications([]);
      setLegacyError(null);
      setIsLoading(false);
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setLegacyNotifications([]);
      setLegacyError('A bearer token is required before loading notifications.');
      return;
    }

    setIsLoading(true);
    setLegacyError(null);

    try {
      const items = await fetchLegacyNotifications();
      setLegacyNotifications(items);
      void Log('frontend', 'debug', 'state', `Notification state refreshed with ${items.length} item(s) from the API.`);
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : 'Unable to load notifications.';
      setLegacyError(message);
      setLegacyNotifications([]);
      void Log('frontend', 'error', 'state', `Notification state failed to refresh: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [isLegacyMode, mode]);

  const submitNotification = useCallback(async (payload: NotificationPayload) => {
    setIsSaving(true);
    setLegacyError(null);

    try {
      const created = await createNotification(payload);
      setLegacyNotifications((current) => [created, ...current]);
      void Log('frontend', 'info', 'state', `Notification state inserted "${payload.title}" at the top of the list after a successful create action.`);
      return created;
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Unable to create notification.';
      setLegacyError(message);
      void Log('frontend', 'error', 'state', `Notification state could not create "${payload.title}": ${message}`);
      throw submissionError instanceof Error ? submissionError : new Error(message);
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => {
    if (!isLegacyMode) {
      void fetchNotifications();
    }
  }, [fetchNotifications, isLegacyMode]);

  useEffect(() => {
    if (isLegacyMode) {
      void refreshNotifications();
    }
  }, [isLegacyMode, refreshNotifications]);

  if (isLegacyMode) {
    return {
      notifications: legacyNotifications,
      isLoading,
      isSaving,
      error: legacyError,
      refreshNotifications,
      submitNotification,
    };
  }

  return {
    notifications,
    loading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    fetchNotifications,
  };
}
