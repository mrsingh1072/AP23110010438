import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Log } from '../../../logging_middleware/log';
import { clearAccessToken, getAccessToken, setAccessToken } from '../utils/tokenStore';
import { buildApiUrl } from '../utils/config';

type AuthContextShape = {
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasBootstrapped = useRef(false);
  const authenticate = async () => {
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

      console.debug('[AuthContext] Auth attempt', { email, timestamp: new Date().toISOString() });

      void Log('frontend', 'info', 'auth', 'Authentication attempt started');

      const response = await fetch(buildApiUrl('/auth'), {
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

      setAccessToken(token);
      setAccessTokenState(token);
      void Log('frontend', 'info', 'auth', `Authentication successful with token (${token.length} chars)`);
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      console.debug('[AuthContext] Auth error', { error: msg, timestamp: new Date().toISOString() });

      setError(msg);
      void Log('frontend', 'error', 'auth', `Auth failed: ${msg}`);

      clearAccessToken();
      setAccessTokenState(null);
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    if (hasBootstrapped.current) {
      return;
    }

    hasBootstrapped.current = true;
    void authenticate();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isLoading,
        error,
        retry: () => {
          void authenticate();
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

