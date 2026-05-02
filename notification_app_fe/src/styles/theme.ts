import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#48624d',
      dark: '#2f4132',
      light: '#6e8770',
      contrastText: '#f5efe6',
    },
    secondary: {
      main: '#c87043',
      dark: '#a4532d',
      light: '#e1a17b',
      contrastText: '#fff6ef',
    },
    background: {
      default: '#efe6d7',
      paper: '#fbf6ee',
    },
    text: {
      primary: '#241b13',
      secondary: '#5f5348',
    },
    divider: '#dccfbf',
    error: {
      main: '#ab4630',
    },
    warning: {
      main: '#c78a2c',
    },
    success: {
      main: '#55714f',
    },
    info: {
      main: '#6e746c',
    },
  },
  typography: {
    fontFamily: '"Segoe UI Variable", "Segoe UI", "Trebuchet MS", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.08))',
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
          paddingBlock: 10,
          transition: 'transform 150ms ease, box-shadow 150ms ease, background-color 150ms ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 12px 28px rgba(48, 42, 34, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
  },
});
