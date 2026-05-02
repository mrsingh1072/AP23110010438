import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerUser, authenticateUser } from '../services/api';
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStore';
import { Log } from '../../../logging_middleware/log';

type TokenContextShape = {
  token: string | null;
  setToken: (t: string | null) => void;
  clearToken: () => void;
};

const TokenContext = createContext<TokenContextShape | undefined>(undefined);

export function TokenProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getAccessToken());

  useEffect(() => {
    let mounted = true;

    async function ensureAuth() {
      const existing = getAccessToken();
      if (existing) {
        setTokenState(existing);
        return;
      }

      try {
        void Log('frontend', 'info', 'auth', 'Attempting automated register+auth flow');

        const credentials = {
          name: 'notification-client',
          email: `client+${Date.now()}@example.com`,
          password: crypto.randomUUID(),
        };

        // Best-effort registration; if it fails (already registered), continue to auth.
        try {
          await registerUser(credentials);
          void Log('frontend', 'info', 'auth', 'Automated registration completed');
        } catch (regErr) {
          void Log('frontend', 'debug', 'auth', 'Automated registration skipped or failed');
        }

        const session = await authenticateUser(credentials);
        if (mounted) {
          setTokenState(session.accessToken);
          void Log('frontend', 'info', 'auth', 'Automated authentication succeeded and token stored in memory');
        }
      } catch (err) {
        void Log('frontend', 'error', 'auth', 'Automated authentication failed');
        clearAccessToken();
        if (mounted) setTokenState(null);
      }
    }

    ensureAuth();

    return () => {
      mounted = false;
    };
  }, []);

  function setToken(t: string | null) {
    if (t && typeof t === 'string' && t.trim()) {
      setAccessToken(t.trim());
      setTokenState(t.trim());
      void Log('frontend', 'info', 'auth', 'Token set via context');
      return;
    }

    clearAccessToken();
    setTokenState(null);
    void Log('frontend', 'info', 'auth', 'Token cleared via context');
  }

  function clearToken() {
    clearAccessToken();
    setTokenState(null);
    void Log('frontend', 'info', 'auth', 'Token cleared via context');
  }

  return <TokenContext.Provider value={{ token, setToken, clearToken }}>{children}</TokenContext.Provider>;
}

export function useToken() {
  const ctx = useContext(TokenContext);
  if (!ctx) throw new Error('useToken must be used within a TokenProvider');
  return ctx;
}
