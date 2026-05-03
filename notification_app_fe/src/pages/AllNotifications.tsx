import { useMemo, useState } from 'react';
import { Alert, Box, Button, Container, Grid, Paper, Stack, Typography } from '@mui/material';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar } from '../components/FilterBar';
import { LoadingState } from '../components/LoadingState';
import { NotificationCard } from '../components/NotificationCard';
import { type NotificationFilter } from '../services/api';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { useViewedNotifications } from '../hooks/useViewedNotifications';
import { Log } from '../../../logging_middleware/log';
import { useAuth } from '../context/AuthContext';


interface NotificationViewModel {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
}

export function AllNotifications() {
  const { accessToken, isLoading: authLoading, error: authError } = useAuth();
  const [filter, setFilter] = useState<NotificationFilter>('All');
  const { notifications, loading, error, page, setPage, limit, setLimit, fetchNotifications } = useNotifications(filter);
  const viewed = useViewedNotifications();

  const items = useMemo<NotificationViewModel[]>(
    () =>
      notifications.map((notification: Notification) => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        isRead: viewed.isRead(notification.id),
      })),
    [notifications, viewed],
  );

  const hasNextPage = notifications.length === limit;

  const viewedCount = useMemo(() => items.filter((item) => item.isRead).length, [items]);

  const handleToggleRead = (notificationId: string) => {
    const targetItem = items.find((item) => item.id === notificationId);

    if (!targetItem) {
      return;
    }

    if (targetItem.isRead) {
      viewed.markUnread(notificationId);
      void Log('frontend', 'info', 'component', 'Notification marked as unread');
      return;
    }

    viewed.markRead(notificationId);
    void Log('frontend', 'info', 'component', 'Notification marked as read');
  };

  const handleFilterChange = (nextFilter: NotificationFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const refreshPage = () => {
    void Log('frontend', 'info', 'component', 'User clicked refresh notifications');
    void fetchNotifications();
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2.5, md: 4 } }}>
      <Stack spacing={3}>
        <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={1.5}>
            <Typography variant="overline" sx={{ letterSpacing: 1.6, color: 'primary.main', fontWeight: 700 }}>
              Page 1
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              All Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 860, lineHeight: 1.8 }}>
              Review all campus notifications, filter by type, paginate, and mark as viewed.
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

        <FilterBar
          filter={filter}
          page={page}
          limit={limit}
          hasNextPage={hasNextPage}
          loading={loading || authLoading}
          onFilterChange={handleFilterChange}
          onPageChange={setPage}
          onLimitChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(1);
          }}
          onRefresh={refreshPage}
        />

        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid', borderColor: 'divider' }}>
          <Stack spacing={2.5}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Notification feed
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Button variant="outlined" onClick={refreshPage} disabled={loading || authLoading || !accessToken}>
                  Reload
                </Button>
                <Button variant="outlined" onClick={() => viewed.clearRead()}>
                  Clear viewed
                </Button>
              </Stack>
            </Box>

            {loading ? <LoadingState label="Loading campus notifications from the API." /> : null}
            {error ? <ErrorState message={error} onRetry={refreshPage} /> : null}
            {!authLoading && accessToken && !loading && !error && items.length === 0 ? (
              <EmptyState
                title="No notifications found"
                description="Try a different page, limit, or notification type. The API returned no items for the current query."
                actionLabel="Reload"
                onAction={refreshPage}
              />
            ) : null}

            {!authLoading && accessToken && !loading && !error && items.length > 0 ? (
              <Grid container spacing={2}>
                {items.map((notification) => (
                  <Grid key={notification.id} item xs={12}>
                    <NotificationCard notification={notification} onToggleRead={handleToggleRead} />
                  </Grid>
                ))}
              </Grid>
            ) : null}

            <Typography variant="caption" color="text.secondary">
              Viewed items in this page: {viewedCount}. The NEW badge disappears after a card is clicked.
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}