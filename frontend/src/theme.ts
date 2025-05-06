import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#005670', // Deep blue from vtinsuranceagency.com
    },
    secondary: {
      main: '#F58220', // Vibrant orange from vtinsuranceagency.com
    },
    background: {
      default: '#FFFFFF', // White background
    },
    text: {
      primary: '#1A2526', // Dark gray/black for headings
      secondary: '#6D8299', // Medium gray for secondary text
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#0288D1',
    },
    success: {
      main: '#2E7D32',
    },
  },
});

export default theme;
