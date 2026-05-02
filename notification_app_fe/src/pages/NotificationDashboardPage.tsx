import { useEffect, useMemo } from 'react';
import { Alert, Box, Button, Chip, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { Log } from '../../../logging_middleware/log';
import { useAuth } from '../hooks/useAuth';
import { useLifecycleLog } from '../hooks/useLifecycleLog';
import { useNotifications } from '../hooks/useNotifications';
import { AuthPanel } from '../components/AuthPanel';
import { NotificationComposer } from '../components/NotificationComposer';
import { NotificationList } from '../components/NotificationList';

export function NotificationDashboardPage() {
  useLifecycleLog('page', 'Notification dashboard page');
  const auth = useAuth();
  const notifications = useNotifications(auth.isAuthenticated);

  useEffect(() => {
    void Log('frontend', 'info', 'page', 'Notification dashboard page mounted and navigation has landed on the main workspace.');
    return () => {
      void Log('frontend', 'info', 'page', 'Notification dashboard page unmounted and the view is leaving the workspace.');
    };
  }, []);

  const stats = useMemo(() => {
    const total = notifications.notifications.length;
    const unread = notifications.notifications.filter((item) => !item.read).length;
    const warningCount = notifications.notifications.filter((item) => item.severity === 'warning' || item.severity === 'error').length;

    return [
      { label: 'Loaded', value: total },
      { label: 'Unread', value: unread },
      { label: 'Escalations', value: warningCount },
    ];
  }, [notifications.notifications]);

  const handleCreate = async (payload: Parameters<typeof notifications.submitNotification>[0]) => {
    await notifications.submitNotification(payload);
  };

  return (
    <Box sx={{ minHeight: '100vh', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={3.5}>
          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 5,
              p: { xs: 3, md: 4 },
              background:
                'linear-gradient(135deg, rgba(251,246,238,0.95) 0%, rgba(243,232,218,0.92) 58%, rgba(231,221,208,0.88) 100%)',
              overflow: 'hidden',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -80,
                top: -70,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(198,112,67,0.18) 0%, rgba(198,112,67,0.02) 70%)',
                pointerEvents: 'none',
              },
            }}
          >
            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack spacing={1.5}>
                <Chip label="Notification System" color="primary" variant="outlined" sx={{ width: 'fit-content' }} />
                <Typography variant="h3" sx={{ maxWidth: 780 }}>
                  Notifications, auth, and logging in one focused operator workspace.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.8 }}>
                  Register and authenticate against the evaluation service, create notifications, and inspect the live dashboard state. Every API call uses the shared logging middleware once a token exists.
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                <Chip label="Memory-only token storage" color="secondary" variant="outlined" />
                <Chip label="Material UI shell" variant="outlined" />
                <Chip label="Responsive desktop + mobile" variant="outlined" />
              </Stack>
            </Stack>
          </Paper>

          {auth.error ? <Alert severity="error">{auth.error}</Alert> : null}

          <Grid container spacing={3}>
            <Grid item xs={12} lg={4}>
              <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="overline" sx={{ letterSpacing: 1.6, color: 'primary.main', fontWeight: 700 }}>
                      Access
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      Register and authenticate
                    </Typography>
                  </Box>
                  <AuthPanel
                    session={auth.session}
                    isSubmitting={auth.isSubmitting}
                    error={auth.error}
                    onSubmit={auth.submitCredentials}
                    onSignOut={auth.signOut}
                    onDismissError={auth.clearError}
                  />
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={8}>
              <Stack spacing={3}>
                <Grid container spacing={2}>
                  {stats.map((stat) => (
                    <Grid key={stat.label} item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 2.25, border: '1px solid', borderColor: 'divider', borderRadius: 4 }}>
                        <Stack spacing={0.5}>
                          <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.3 }}>
                            {stat.label}
                          </Typography>
                          <Typography variant="h4" sx={{ fontWeight: 800 }}>
                            {stat.value}
                          </Typography>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={5}>
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                      <Stack spacing={2.25}>
                        <Box>
                          <Typography variant="overline" sx={{ letterSpacing: 1.6, color: 'secondary.main', fontWeight: 700 }}>
                            Composer
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: 800 }}>
                            Create notification
                          </Typography>
                        </Box>
                        {auth.isAuthenticated ? (
                          <NotificationComposer
                            disabled={!auth.isAuthenticated}
                            isSaving={notifications.isSaving}
                            onSubmit={handleCreate}
                          />
                        ) : (
                          <Alert severity="info" variant="outlined">
                            Sign in before creating a notification. The composer activates after the access token is stored in memory.
                          </Alert>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={7}>
                    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: 4, height: '100%' }}>
                      <Stack spacing={2.25}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
                          <Box>
                            <Typography variant="overline" sx={{ letterSpacing: 1.6, color: 'primary.main', fontWeight: 700 }}>
                              Feed
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>
                              Notification list
                            </Typography>
                          </Box>
                          <Button variant="outlined" onClick={notifications.refreshNotifications} disabled={notifications.isLoading || !auth.isAuthenticated}>
                            Refresh
                          </Button>
                        </Box>
                        <Divider />
                        {!auth.isAuthenticated ? (
                          <Alert severity="info" variant="outlined">
                            Authenticate to load notifications from the external service.
                          </Alert>
                        ) : (
                          <NotificationList
                            notifications={notifications.notifications}
                            isLoading={notifications.isLoading}
                            error={notifications.error}
                            onRetry={notifications.refreshNotifications}
                          />
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
