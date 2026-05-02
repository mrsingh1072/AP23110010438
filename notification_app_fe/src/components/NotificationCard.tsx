import { Badge, Box, Button, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import { formatCampusTimestamp, formatRelativeCampusTime, getPriorityScore } from '../utils/prioritySort';
import type { CampusNotificationType } from '../services/api';

interface NotificationCardProps {
  notification: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    type?: CampusNotificationType;
    timestamp?: string;
  };
  onToggleRead: (id: string) => void;
  priorityRank?: number;
}

const typePalette: Record<CampusNotificationType, 'primary' | 'secondary' | 'warning'> = {
  Event: 'primary',
  Result: 'secondary',
  Placement: 'warning',
};

const typeSymbol: Record<CampusNotificationType, string> = {
  Event: '✦',
  Result: '✓',
  Placement: '⌁',
};

export function NotificationCard({ notification, onToggleRead, priorityRank }: NotificationCardProps) {
  const priorityScore = notification.type ? getPriorityScore(notification.type) : 0;
  const accentType = notification.type ?? 'Event';
  const symbol = notification.type ? typeSymbol[notification.type] : '•';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: notification.isRead ? 'divider' : 'secondary.main',
        backgroundColor: notification.isRead ? 'rgba(255,255,255,0.58)' : 'rgba(252,245,236,0.95)',
        opacity: notification.isRead ? 0.86 : 1,
        boxShadow: notification.isRead ? '0 8px 20px rgba(37, 29, 22, 0.05)' : '0 10px 24px rgba(37, 29, 22, 0.08)',
        transition:
          'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background-color 180ms ease, opacity 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 18px 36px rgba(37, 29, 22, 0.12)',
          cursor: 'pointer',
        },
      }}
    >
      <CardActionArea onClick={() => onToggleRead(notification.id)} sx={{ alignItems: 'stretch' }}>
        <CardContent>
          <Stack spacing={1.4}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} flexWrap="wrap">
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                {notification.type ? (
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      backgroundColor: 'rgba(71, 98, 77, 0.12)',
                      color: `${typePalette[notification.type]}.main`,
                      fontSize: 18,
                      fontWeight: 800,
                      lineHeight: 1,
                      flex: '0 0 auto',
                    }}
                  >
                    {symbol}
                  </Box>
                ) : null}
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {notification.title}
                </Typography>
                {notification.type ? <Chip label={notification.type} size="small" variant="outlined" color={typePalette[notification.type]} /> : null}
                {!notification.isRead ? <Badge color="error" badgeContent="NEW" overlap="circular" /> : <Chip label="Read" size="small" variant="outlined" />}
                {notification.type ? <Chip label={`Priority ${priorityScore}`} size="small" variant="outlined" color={typePalette[accentType]} /> : null}
              </Stack>
              {priorityRank ? <Chip label={`Top #${priorityRank}`} color="primary" variant="outlined" size="small" /> : null}
            </Stack>

            <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {notification.message}
            </Typography>

            <Box display="flex" justifyContent="space-between" alignItems="center" gap={1} flexWrap="wrap">
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={notification.id} size="small" variant="outlined" />
                {notification.timestamp ? <Chip label={formatRelativeCampusTime(notification.timestamp)} size="small" variant="outlined" /> : null}
                {notification.timestamp ? <Chip label={formatCampusTimestamp(notification.timestamp)} size="small" variant="outlined" /> : null}
              </Stack>
              <Button size="small" variant="outlined" onClick={(event) => { event.stopPropagation(); onToggleRead(notification.id); }}>
                {notification.isRead ? 'Mark unread' : 'Mark read'}
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}