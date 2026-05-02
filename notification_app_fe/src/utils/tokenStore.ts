let accessToken: string | null = null;

declare global {
  interface Window {
    __CAMPUS_ACCESS_TOKEN__?: string | null;
  }
}

export function setAccessToken(token: string | null): void {
  accessToken = token;

  if (typeof window !== 'undefined') {
    window.__CAMPUS_ACCESS_TOKEN__ = token;
  }
}

export function getAccessToken(): string | null {
  if (accessToken) {
    return accessToken;
  }

  if (typeof window !== 'undefined') {
    return window.__CAMPUS_ACCESS_TOKEN__ ?? null;
  }

  return null;
}

export function clearAccessToken(): void {
  accessToken = null;

  if (typeof window !== 'undefined') {
    window.__CAMPUS_ACCESS_TOKEN__ = null;
  }
}

export function syncAccessTokenFromStorage(token: string | null): void {
  setAccessToken(token);
}
