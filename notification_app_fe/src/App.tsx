import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { appTheme } from './styles/theme';
import { AuthProvider } from './context/AuthContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { Navbar } from './components/Navbar';
import { AllNotifications } from './pages/AllNotifications';
import { PriorityNotifications } from './pages/PriorityNotifications';
import { Log } from '../../logging_middleware/log';
import { useEffect, useRef } from 'react';
import { useAuth } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { accessToken, isLoading, error, retry } = useAuth();
  const hasLoggedLoad = useRef(false);

  useEffect(() => {
    if (!hasLoggedLoad.current && accessToken) {
      void Log('frontend', 'info', 'page', 'Application loaded');
      hasLoggedLoad.current = true;
    }
  }, [accessToken]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AppErrorBoundary>
          <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
            <Navbar isLoading={isLoading} error={error} onRetry={retry} />
            <Routes>
              <Route path="/" element={<AllNotifications />} />
              <Route path="/priority" element={<PriorityNotifications />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </AppErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
