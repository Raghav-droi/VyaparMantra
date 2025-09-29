import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF8C00',
      light: '#FFB347',
      lighter: '#FFD580',
      contrastText: '#fff',
    },
    secondary: {
      main: '#3949AB',
      contrastText: '#fff',
    },
    error: {
      main: '#E53935',
    },
    warning: {
      main: '#FF8C00',
    },
    success: {
      main: '#4CAF50',
    },
    background: {
      default: '#FFF8E1',
      paper: '#FFFFFF',
      gradient: 'linear-gradient(135deg, #FF8C00 0%, #FFB347 50%, #FFD580 100%)',
    },
    text: {
      primary: '#333',
      secondary: '#666',
      light: '#999',
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 'bold',
      color: '#FF8C00',
    },
    h5: {
      fontWeight: '600',
      color: '#3949AB',
    },
    h6: {
      fontWeight: '600',
      color: '#333',
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 'bold',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #FF8C00 30%, #FFB347 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #e67c00 30%, #ff9f33 90%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
