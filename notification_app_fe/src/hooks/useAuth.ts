import { useCallback, useState } from 'react';
import { Log } from '../../../logging_middleware/log';
import { authenticateUser, registerUser, type AuthCredentials, type AuthSession } from '../services/api';
import { clearAccessToken } from '../utils/tokenStore';

interface AuthState {
  session: AuthSession | null;
  isSubmitting: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    isSubmitting: false,
    error: null,
  });

  const submitCredentials = useCallback(async (credentials: AuthCredentials) => {
    setState((current) => ({ ...current, isSubmitting: true, error: null }));

    try {
      await registerUser(credentials);
      const session = await authenticateUser(credentials);
      setState({ session, isSubmitting: false, error: null });
      void Log('frontend', 'info', 'hook', 'Authentication hook promoted the in-memory session after a successful register-and-auth flow.');
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete authentication.';
      setState((current) => ({ ...current, isSubmitting: false, error: message }));
      void Log('frontend', 'error', 'hook', `Authentication hook rejected the request: ${message}`);
      throw error instanceof Error ? error : new Error(message);
    }
  }, []);

  const signOut = useCallback(() => {
    clearAccessToken();
    setState({ session: null, isSubmitting: false, error: null });
    void Log('frontend', 'info', 'hook', 'Authentication hook cleared the in-memory token during sign-out.');
  }, []);

  const clearError = useCallback(() => {
    setState((current) => ({ ...current, error: null }));
  }, []);

  return {
    session: state.session,
    isAuthenticated: state.session !== null,
    isSubmitting: state.isSubmitting,
    error: state.error,
    submitCredentials,
    signOut,
    clearError,
  };
}
