import { AppBar, Box, Button, Container, Stack, Toolbar, Typography, CircularProgress, Alert } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';

interface NavbarProps {
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function Navbar({ isLoading, error, onRetry }: NavbarProps) {
  const location = useLocation();

  return (
    <AppBar position="sticky" elevation={0} color="transparent" sx={{ backdropFilter: 'blur(14px)', borderBottom: '1px solid', borderBottomColor: 'divider' }}>
      <Toolbar disableGutters sx={{ py: 1.5 }}>
        <Container maxWidth="xl">
          <Stack spacing={1.5}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  Campus Notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time notification system with priority sorting
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {isLoading && <CircularProgress size={20} />}
                <Typography variant="caption" color={error ? 'error' : 'success'}>
                  {error ? 'Auth failed' : isLoading ? 'Authenticating...' : 'Connected'}
                </Typography>
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ py: 1 }}>
                {error}
                <Button size="small" onClick={onRetry} sx={{ ml: 1 }}>
                  Retry
                </Button>
              </Alert>
            )}

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button component={RouterLink} to="/" variant={location.pathname === '/' ? 'contained' : 'outlined'}>
                All Notifications
              </Button>
              <Button component={RouterLink} to="/priority" variant={location.pathname === '/priority' ? 'contained' : 'outlined'}>
                Priority Notifications
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  );
}