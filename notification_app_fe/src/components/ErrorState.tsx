import { Alert, Button, Stack } from '@mui/material';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Stack spacing={1.5}>
      <Alert severity="error" variant="outlined">
        {message}
      </Alert>
      {onRetry ? (
        <Button variant="outlined" color="primary" onClick={onRetry} sx={{ alignSelf: 'flex-start' }}>
          Retry
        </Button>
      ) : null}
    </Stack>
  );
}
