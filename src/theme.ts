import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // Material Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#fff',
    },
    secondary: {
      main: '#9c27b0', // Material Purple
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#fff',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ed6c02',
    },
    info: {
      main: '#0288d1',
    },
    success: {
      main: '#2e7d32',
    },
  },
  typography: {
    fontSize: 16, // Base 16px for outdoor readability
    fontFamily: '"Inter", "system-ui", "Avenir", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: 'none', // Disable uppercase buttons
      fontSize: '16px',
      fontWeight: 500,
    },
    body1: {
      fontSize: '16px',
    },
    body2: {
      fontSize: '14px',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: false,
      },
      styleOverrides: {
        root: {
          minHeight: 44, // 44px touch targets
          minWidth: 44,
          borderRadius: 8,
        },
        sizeMedium: {
          padding: '12px 16px',
        },
        sizeLarge: {
          padding: '16px 24px',
          fontSize: '18px',
          minHeight: 48,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 12, // Larger touch target
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          minHeight: 44,
        },
      },
    },
  },
  spacing: 8, // 8px grid system (MUI default)
})
