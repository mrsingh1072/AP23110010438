import type { PropsWithChildren, ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface PanelCardProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  accent?: string;
  action?: ReactNode;
}

export function PanelCard({ title, subtitle, accent = '#48624d', action, children }: PanelCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        p: { xs: 2.25, sm: 2.75 },
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${accent}16, transparent 58%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Stack spacing={2} sx={{ position: 'relative' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="overline" sx={{ color: accent, letterSpacing: 1.6, fontWeight: 700 }}>
              {subtitle}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.25 }}>
              {title}
            </Typography>
          </Box>
          {action}
        </Box>
        {children}
      </Stack>
    </Paper>
  );
}
