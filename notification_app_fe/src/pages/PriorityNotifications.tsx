import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Container, Grid, Paper, Slider, Stack, TextField, Typography } from '@mui/material';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { NotificationCard } from '../components/NotificationCard';
import { fetchAllCampusNotifications, type CampusNotification } from '../services/api';
import { selectTopPriority, sortByPriority } from '../utils/prioritySort';
import { useViewedNotifications } from '../hooks/useViewedNotifications';
import { Log } from '../../../logging_middleware/log';
import { useAuth } from '../context/AuthContext';


interface NotificationViewModel {
  ID: string;
  Type: CampusNotification['Type'];
  Message: string;
  Timestamp: string;
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  type: CampusNotification['Type'];
  timestamp: string;
}

export function PriorityNotifications() {
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const [topN, setTopN] = useState(5);
  const [items, setItems] = useState<NotificationViewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewed = useViewedNotifications();

  const loadPriorityNotifications = useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allNotifications = await fetchAllCampusNotifications(accessToken);
      const prioritizedNotifications = sortByPriority(allNotifications).map((item) => ({
        ID: item.ID,
        Type: item.Type,
        Message: item.Message,
        Timestamp: item.Timestamp,
        id: item.ID,
        title: item.Type,
        message: item.Message,
        isRead: viewed.isRead(item.ID),
        type: item.Type,
        timestamp: item.Timestamp,
      }));

      setItems(prioritizedNotifications);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load priority notifications.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, viewed.isRead]);

  useEffect(() => {
    void loadPriorityNotifications();
  }, [loadPriorityNotifications]);

  const topNotifications = useMemo(() => selectTopPriority(items, topN), [items, topN]);

  const handleToggleRead = (notificationId: string) => {
    const targetItem = items.find((item) => item.id === notificationId);

    if (!targetItem) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: !item.isRead } : item,
      ),
    );

    if (targetItem.isRead) {
      viewed.markUnread(notificationId);
      void Log('frontend', 'info', 'component', 'Notification marked as unread');
      return;
    }

    viewed.markRead(notificationId);
    void Log('frontend', 'info', 'component', 'Notification marked as read');
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ letterSpacing: 1.6, color: 'secondary.main', fontWeight: 700 }}>
              Page 2
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Priority Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.8 }}>
              The list is ranked with Placement above Result above Event, and ties are resolved by the latest timestamp. Change N to update the top set instantly.
            </Typography>
          </Stack>
        </Paper>

        {authError && (
          <Alert severity="error">{authError}</Alert>
        )}
        {authLoading && (
          <Alert severity="info">Authenticating...</Alert>
        )}
        {!authLoading && !authError && !accessToken && (
          <Alert severity="warning">Token not yet available</Alert>
        )}

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Top N controls
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Placement &gt; Result &gt; Event
              </Typography>
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Top N"
                type="number"
                value={topN}
                onChange={(event) => setTopN(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
                inputProps={{ min: 1, max: 50 }}
                helperText="Choose how many notifications to show. The list updates immediately."
              />
              <Slider
                value={topN}
                min={1}
                max={20}
                step={1}
                onChange={(_, value) => setTopN(Array.isArray(value) ? value[0] ?? 1 : value)}
                valueLabelDisplay="auto"
              />
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2.5}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Priority feed
            </Typography>

            {loading ? <LoadingState label="Collecting campus notifications for priority ranking." /> : null}
            {error ? <ErrorState message={error} onRetry={loadPriorityNotifications} /> : null}
            {!authLoading && accessToken && !loading && !error && topNotifications.length === 0 ? (
              <EmptyState
                title="No notifications available"
                description="The API returned no notifications, so there is nothing to rank yet."
                actionLabel="Reload"
                onAction={loadPriorityNotifications}
              />
            ) : null}

            {!authLoading && accessToken && !loading && !error && topNotifications.length > 0 ? (
              <Grid container spacing={2}>
                {topNotifications.map((notification, index) => (
                  <Grid key={notification.id} item xs={12}>
                    <NotificationCard
                      notification={notification}
                      onToggleRead={handleToggleRead}
                      priorityRank={index + 1}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}