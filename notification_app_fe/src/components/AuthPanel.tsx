import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Box, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import type { AuthCredentials, AuthSession } from '../services/api';
import { useLifecycleLog } from '../hooks/useLifecycleLog';

interface AuthPanelProps {
  session: AuthSession | null;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (credentials: AuthCredentials) => Promise<AuthSession>;
  onSignOut: () => void;
  onDismissError: () => void;
}

const initialCredentials: AuthCredentials = {
  name: '',
  email: '',
  password: '',
};

export function AuthPanel({ session, isSubmitting, error, onSubmit, onSignOut, onDismissError }: AuthPanelProps) {
  useLifecycleLog('component', 'Auth panel');
  const [credentials, setCredentials] = useState<AuthCredentials>(initialCredentials);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onDismissError();
    }, 6000);

    return () => window.clearTimeout(timeout);
  }, [error, onDismissError]);

  const handleChange = (field: keyof AuthCredentials) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setCredentials((current) => ({ ...current, [field]: nextValue }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(credentials);
  };

  if (session) {
    return (
      <Box>
        <Stack spacing={2}>
          <Alert severity="success" variant="outlined">
            Signed in as {session.displayName}. The access token remains in memory only.
          </Alert>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={session.email} color="primary" variant="outlined" />
            <Chip label="Session live" color="secondary" variant="outlined" />
          </Stack>
          <Button variant="outlined" color="primary" onClick={onSignOut} sx={{ alignSelf: 'flex-start' }}>
            Sign out
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          Register first, then authenticate. The app stores the token only in memory and clears it on reload or sign out.
        </Typography>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField label="Display name" value={credentials.name} onChange={handleChange('name')} placeholder="Operations Desk" required />
        <TextField label="Email" type="email" value={credentials.email} onChange={handleChange('email')} placeholder="team@company.com" required />
        <TextField label="Password" type="password" value={credentials.password} onChange={handleChange('password')} placeholder="Enter a secure password" required />
        <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Registering and signing in...' : 'Register & Sign In'}
        </Button>
      </Stack>
    </Box>
  );
}
