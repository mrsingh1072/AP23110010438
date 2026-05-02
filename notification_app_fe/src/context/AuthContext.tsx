import React, { createContext, useContext, useEffect, useState } from 'react';
import { Log } from '../../../logging_middleware/log';

type AuthContextShape = {
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  retryCount: number;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY_MS = 2000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);

  /**
   * Set token in global window and in memory
   */
  function setTokenGlobal(token: string | null) {
    if (token) {
      if (typeof window !== 'undefined') {
        (window as any).__CAMPUS_ACCESS_TOKEN__ = token;
      }
      setAccessToken(token);
    } else {
      if (typeof window !== 'undefined') {
        (window as any).__CAMPUS_ACCESS_TOKEN__ = null;
      }
      setAccessToken(null);
    }
  }

  /**
   * Authenticate using env variables
   */
  async function authenticate() {
    setIsLoading(true);
    setError(null);

    try {
      const clientID = import.meta.env.VITE_CLIENT_ID;
      const clientSecret = import.meta.env.VITE_CLIENT_SECRET;
      const email = import.meta.env.VITE_EMAIL;
      const name = import.meta.env.VITE_NAME;
      const rollNo = import.meta.env.VITE_ROLLNO;
      const accessCode = import.meta.env.VITE_ACCESS_CODE;

      if (!clientID || !clientSecret || !email || !name || !rollNo || !accessCode) {
        throw new Error('Missing required environment variables for authentication');
      }

      const payload = {
        clientID,
        clientSecret,
        email,
        name,
        rollNo,
        accessCode,
      };

      console.debug('[AuthContext] Auth attempt', {
        attempt: retryCount + 1,
        maxAttempts: MAX_AUTH_RETRIES,
        email,
        timestamp: new Date().toISOString(),
      });

      void Log('frontend', 'info', 'auth', `Authentication attempt ${retryCount + 1}/${MAX_AUTH_RETRIES}`);

      const response = await fetch('/evaluation-service/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const data = text ? safeJsonParse(text) : null;

      console.debug('[AuthContext] Auth response', {
        status: response.status,
        dataKeys: typeof data === 'object' && data !== null ? Object.keys(data as any) : null,
        timestamp: new Date().toISOString(),
      });

      if (response.status !== 200 && response.status !== 201) {
        const msg = extractErrorMessage(data, `Auth failed with status ${response.status}`);
        throw new Error(msg);
      }

      const token = normalizeToken(data);
      console.debug('[AuthContext] Token acquired', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...',
        timestamp: new Date().toISOString(),
      });

      setTokenGlobal(token);
      void Log('frontend', 'info', 'auth', `Authentication successful with token (${token.length} chars)`);
      setError(null);
      setHasAttempted(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      console.debug('[AuthContext] Auth error', {
        error: msg,
        attempt: retryCount + 1,
        maxAttempts: MAX_AUTH_RETRIES,
        canRetry: retryCount + 1 < MAX_AUTH_RETRIES,
        timestamp: new Date().toISOString(),
      });

      if (retryCount + 1 < MAX_AUTH_RETRIES) {
        setError(`${msg} (attempt ${retryCount + 1}/${MAX_AUTH_RETRIES}, retrying...)`);
        void Log('frontend', 'warn', 'auth', `Auth failed: ${msg}. Retrying in ${AUTH_RETRY_DELAY_MS}ms...`);

        // Schedule retry after delay
        setTimeout(() => {
          setRetryCount((c) => c + 1);
        }, AUTH_RETRY_DELAY_MS);
      } else {
        setError(msg);
        void Log('frontend', 'error', 'auth', `Auth failed after ${MAX_AUTH_RETRIES} attempts: ${msg}`);
        setHasAttempted(true);
      }

      setTokenGlobal(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    authenticate();
  }, [retryCount]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isLoading,
        error,
        retryCount,
        retry: () => {
          if (retryCount + 1 >= MAX_AUTH_RETRIES) {
            setRetryCount(0);
          } else {
            setRetryCount((c) => c + 1);
          }
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data === 'object' && data !== null) {
    const d = data as any;
    return d.message || d.error || d.details || fallback;
  }
  return fallback;
}

function normalizeToken(data: unknown): string {
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data === 'object' && data !== null) {
    const d = data as any;
    const token = d.access_token || d.accessToken || d.token;
    if (typeof token === 'string' && token.trim()) return token;
  }
  throw new Error('Auth response missing access_token');
}
