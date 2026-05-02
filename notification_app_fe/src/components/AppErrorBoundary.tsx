import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { Log } from '../../../logging_middleware/log';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public state: AppErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    void Log('frontend', 'fatal', 'component', `Unhandled UI error occurred: ${error.message}`);
    void Log('frontend', 'fatal', 'component', `Error boundary stack trace: ${(errorInfo.componentStack ?? '').trim()}`);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 3, backgroundColor: 'rgba(255,255,255,0.7)' }}>
            <Stack spacing={2}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Something went wrong
              </Typography>
              <Alert severity="error" variant="outlined">
                An unexpected UI error occurred. Logging has been triggered in the background.
              </Alert>
              <Button variant="contained" onClick={() => window.location.reload()} sx={{ width: 'fit-content' }}>
                Reload app
              </Button>
            </Stack>
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}