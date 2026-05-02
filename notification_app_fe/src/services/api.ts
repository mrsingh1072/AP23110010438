import { Log } from '../../../logging_middleware/log';

export type CampusNotificationType = 'Event' | 'Result' | 'Placement';
export type NotificationFilter = 'All' | CampusNotificationType;

export interface CampusNotification {
  ID: string;
  Type: CampusNotificationType;
  Message: string;
  Timestamp: string;
}

export interface CampusNotificationQuery {
  limit: number;
  page: number;
  notificationType: NotificationFilter;
}

/**
 * Get access token from global window object (set by auth context)
 */
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (window as any).__CAMPUS_ACCESS_TOKEN__ ?? null;
}

const CAMPUS_NOTIFICATIONS_ENDPOINT = '/evaluation-service/notifications';
const API_BASE = '';
const MAX_PAGES_TO_FETCH = 50;

function buildApiUrl(path: string): string {
  return `${path}`;
}

function isValidNotificationType(value: string): value is CampusNotificationType {
  return value === 'Event' || value === 'Result' || value === 'Placement';
}

function normalizeCampusNotification(input: unknown): CampusNotification | null {
  if (typeof input !== 'object' || input === null) {
    return null;
  }

  const record = input as Record<string, unknown>;
  const id = typeof record.ID === 'string' ? record.ID : '';
  const typeCandidate = typeof record.Type === 'string' ? record.Type : '';
  const message = typeof record.Message === 'string' ? record.Message : '';
  const timestamp = typeof record.Timestamp === 'string' ? record.Timestamp : '';

  if (!id || !isValidNotificationType(typeCandidate) || !message || !timestamp) {
    return null;
  }

  return {
    ID: id,
    Type: typeCandidate,
    Message: message,
    Timestamp: timestamp,
  };
}

function parseNotificationList(body: unknown): CampusNotification[] {
  if (typeof body !== 'object' || body === null) {
    return [];
  }

  const record = body as Record<string, unknown>;
  const notifications = record.notifications;

  if (!Array.isArray(notifications)) {
    return [];
  }

  return notifications
    .map((item) => normalizeCampusNotification(item))
    .filter((item): item is CampusNotification => item !== null);
}

function buildCampusUrl(query: Partial<CampusNotificationQuery>): string {
  const params = new URLSearchParams();

  if (Number.isInteger(query.limit) && (query.limit as number) > 0) {
    params.set('limit', String(query.limit));
  }

  if (Number.isInteger(query.page) && (query.page as number) > 0) {
    params.set('page', String(query.page));
  }

  if (query.notificationType && query.notificationType !== 'All') {
    params.set('notification_type', query.notificationType);
  }

  const queryString = params.toString();
  return queryString ? `${CAMPUS_NOTIFICATIONS_ENDPOINT}?${queryString}` : CAMPUS_NOTIFICATIONS_ENDPOINT;
}

async function requestCampusNotifications(query: Partial<CampusNotificationQuery>, token: string): Promise<CampusNotification[]> {
  if (!token.trim()) {
    throw new Error('A bearer token is required before loading campus notifications.');
  }

  const page = Math.max(1, Math.trunc(query.page || 1));
  const limit = Math.max(1, Math.min(100, Math.trunc(query.limit || 10)));

  void Log('frontend', 'info', 'api', `Fetching notifications with page ${page} and limit ${limit}`);

  const url = buildCampusUrl(query);
  console.debug('[API] Notifications request', { url, page, limit, token: token?.substring(0, 20) + '...' });

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const responseText = await response.text();
  const parsedBody = responseText ? safeJsonParse(responseText) : null;

  console.debug('[API] Notifications response', {
    url,
    status: response.status,
    ok: response.ok,
    bodyPreview: typeof parsedBody === 'object' ? JSON.stringify(parsedBody).substring(0, 200) : responseText?.substring(0, 200),
  });

  if (!response.ok) {
    const fallback = `Notification request failed with status ${response.status}.`;
    const message = extractErrorMessage(parsedBody, fallback);
    console.debug('[API] Notifications error', { status: response.status, message, body: parsedBody });
    void Log('frontend', 'error', 'api', 'Failed to fetch notifications');
    throw new Error(message);
  }

  const notifications = parseNotificationList(parsedBody);
  void Log('frontend', 'info', 'api', 'Notifications fetched successfully');

  return notifications;
}

export async function fetchNotificationPage(token: string, query: CampusNotificationQuery): Promise<CampusNotification[]> {
  try {
    const sanitizedQuery: CampusNotificationQuery = {
      limit: Math.max(1, Math.min(100, Math.trunc(query.limit) || 10)),
      page: Math.max(1, Math.trunc(query.page) || 1),
      notificationType: query.notificationType,
    };

    const notifications = await requestCampusNotifications(sanitizedQuery, token);
    if (notifications.length === 0) {
      void Log('frontend', 'warn', 'api', 'No notifications returned from API');
    }
    return notifications;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load notifications.';
    void Log('frontend', 'error', 'api', `Campus notification fetch failed: ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function fetchAllCampusNotifications(token: string): Promise<CampusNotification[]> {
  try {
    const pageSize = 100;
    const results: CampusNotification[] = [];

    for (let page = 1; page <= MAX_PAGES_TO_FETCH; page += 1) {
      const batch = await requestCampusNotifications({ page, limit: pageSize, notificationType: 'All' }, token);
      results.push(...batch);

      if (batch.length < pageSize) {
        break;
      }
    }

    void Log('frontend', 'info', 'api', `Fetched ${results.length} campus notification(s) across all pages for priority sorting.`);
    if (results.length === 0) {
      void Log('frontend', 'warn', 'api', 'No notifications returned from API');
    }
    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load all notifications.';
    void Log('frontend', 'error', 'api', `Campus notification bulk fetch failed: ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error';

export interface AuthCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  displayName: string;
  email: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  severity: NotificationSeverity;
}

export interface NotificationRecord extends NotificationPayload {
  id: string;
  createdAt: string;
  read?: boolean;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

type RawNotification = Partial<NotificationRecord> & {
  _id?: string;
  body?: string;
  content?: string;
  text?: string;
  timestamp?: string;
  created_at?: string;
};

type ApiErrorShape = {
  message?: string;
  error?: string;
  details?: string;
};

function isApiErrorShape(value: unknown): value is ApiErrorShape {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (isApiErrorShape(body)) {
    return body.message ?? body.error ?? body.details ?? fallback;
  }

  return fallback;
}

function normalizeToken(body: unknown): string {
  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const tokenValue = record.access_token ?? record.accessToken ?? record.token ?? record.data;

    if (typeof tokenValue === 'string' && tokenValue.trim()) {
      return tokenValue;
    }
  }

  throw new Error('Authentication succeeded, but the response did not contain an access token.');
}

function normalizeNotification(item: RawNotification): NotificationRecord {
  return {
    id: item.id ?? item._id ?? crypto.randomUUID(),
    title: item.title ?? 'Untitled notification',
    message: item.message ?? item.body ?? item.content ?? item.text ?? 'No details were returned by the API.',
    severity: item.severity ?? 'info',
    createdAt: item.createdAt ?? item.created_at ?? item.timestamp ?? new Date().toISOString(),
    ...(item.read === undefined ? {} : { read: item.read }),
  };
}

function normalizeNotificationList(body: unknown): NotificationRecord[] {
  if (Array.isArray(body)) {
    return body.map((item) => normalizeNotification(item as RawNotification));
  }

  if (typeof body === 'object' && body !== null) {
    const record = body as Record<string, unknown>;
    const listValue = record.notifications ?? record.items ?? record.data ?? record.result;

    if (Array.isArray(listValue)) {
      return listValue.map((item) => normalizeNotification(item as RawNotification));
    }
  }

  return [];
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const hasAuth = options.auth !== false;
  const headers = {
    'Content-Type': 'application/json',
    ...(hasAuth && token ? { Authorization: `Bearer ${token}` } : {}),
  };

  console.debug('[API] Request', {
    method: options.method ?? 'GET',
    path,
    hasToken: !!token,
    tokenLength: token?.length,
    timestamp: new Date().toISOString(),
  });

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };

  if (options.body !== undefined) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await fetch(buildApiUrl(path), requestInit);

  const responseText = await response.text();
  const parsedBody = responseText ? safeJsonParse(responseText) : null;

  console.debug('[API] Response', {
    path,
    status: response.status,
    ok: response.ok,
    contentLength: responseText.length,
    dataType: typeof parsedBody,
    timestamp: new Date().toISOString(),
  });

  if (!response.ok) {
    const errorMsg = extractErrorMessage(parsedBody, `Request to ${path} failed with status ${response.status}.`);
    console.debug('[API] Error response body', { path, status: response.status, body: parsedBody });
    void Log('frontend', 'error', 'api', `API error on ${path}: ${errorMsg} (status ${response.status})`);
    throw new Error(errorMsg);
  }

  void Log('frontend', 'debug', 'api', `API call to ${path} succeeded (${response.status})`);
  return parsedBody as T;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export async function registerUser(credentials: AuthCredentials): Promise<void> {
  try {
    await requestJson('/evaluation-service/register', {
      method: 'POST',
      auth: false,
      body: credentials,
    });

    void Log('frontend', 'info', 'api', 'Registration request completed successfully for the provided notification client.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed for the provided notification client.';
    void Log('frontend', 'error', 'api', `Registration request failed: ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function authenticateUser(credentials: AuthCredentials): Promise<AuthSession> {
  try {
    const body = await requestJson<unknown>('/evaluation-service/auth', {
      method: 'POST',
      auth: false,
      body: {
        email: credentials.email,
        password: credentials.password,
      },
    });

    const accessToken = normalizeToken(body);

    const session: AuthSession = {
      accessToken,
      displayName: credentials.name.trim() || credentials.email.split('@')[0] || 'Authenticated user',
      email: credentials.email,
    };

    void Log('frontend', 'info', 'api', 'Authentication request completed and the access token is now stored in memory.');
    return session;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed for the provided notification client.';
    void Log('frontend', 'error', 'api', `Authentication request failed: ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function fetchNotifications(): Promise<NotificationRecord[]> {
  try {
    const body = await requestJson<unknown>('/evaluation-service/notifications', {
      method: 'GET',
    });

    const notifications = normalizeNotificationList(body);
    void Log('frontend', 'info', 'api', `Notification fetch succeeded with ${notifications.length} item(s) returned by the external API.`);
    return notifications;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notification fetch failed.';
    void Log('frontend', 'error', 'api', `Notification API failed while fetching alerts: ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}

export async function createNotification(payload: NotificationPayload): Promise<NotificationRecord> {
  try {
    const body = await requestJson<unknown>('/evaluation-service/notifications', {
      method: 'POST',
      body: payload,
    });

    const createdFromApi = normalizeNotificationList(body)[0];
    const createdNotification = createdFromApi ?? normalizeNotification({ ...payload, createdAt: new Date().toISOString(), id: crypto.randomUUID() });
    void Log('frontend', 'info', 'api', `Notification creation succeeded for "${payload.title}" and the dashboard state can refresh now.`);
    return createdNotification;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Notification creation failed.';
    void Log('frontend', 'error', 'api', `Notification API failed while creating "${payload.title}": ${message}`);
    throw error instanceof Error ? error : new Error(message);
  }
}
