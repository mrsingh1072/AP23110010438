import { Box, Skeleton, Stack, Typography } from '@mui/material';

export function LoadingState({ label }: { label: string }) {
  return (
    <Box sx={{ py: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Skeleton variant="rounded" height={82} />
        <Skeleton variant="rounded" height={82} />
        <Skeleton variant="rounded" height={82} />
      </Stack>
    </Box>
  );
}
