import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import type { NotificationRecord } from '../services/api';
import { useLifecycleLog } from '../hooks/useLifecycleLog';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

interface NotificationListProps {
  notifications: NotificationRecord[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const severityColorMap: Record<NotificationRecord['severity'], 'default' | 'error' | 'warning' | 'success' | 'primary'> = {
  info: 'default',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function NotificationList({ notifications, isLoading, error, onRetry }: NotificationListProps) {
  useLifecycleLog('component', 'Notification list');

  if (isLoading) {
    return <LoadingState label="Syncing notification records from the external service." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (notifications.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        description="Create the first notification to populate the feed. The list will refresh after every successful API call."
        actionLabel="Refresh now"
        onAction={onRetry}
      />
    );
  }

  return (
    <Stack spacing={1.75}>
      {notifications.map((notification, index) => (
        <Box
          key={notification.id}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            backgroundColor: 'rgba(255,255,255,0.55)',
            p: 2,
            transition: 'transform 140ms ease, box-shadow 140ms ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 14px 30px rgba(48, 42, 34, 0.08)',
            },
          }}
        >
          <Stack spacing={1.1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} flexWrap="wrap" useFlexGap>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {notification.title}
              </Typography>
              <Chip label={notification.severity} size="small" color={severityColorMap[notification.severity]} variant="outlined" />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {notification.message}
            </Typography>
            <Divider flexItem sx={{ borderColor: 'divider' }} />
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Chip label={`ID ${notification.id.slice(0, 8)}`} size="small" variant="outlined" />
              <Chip label={new Date(notification.createdAt).toLocaleString()} size="small" variant="outlined" />
              {notification.read ? <Chip label="Read" size="small" color="success" variant="outlined" /> : <Chip label={`Fresh item #${notifications.length - index}`} size="small" color="primary" variant="outlined" />}
            </Stack>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
