import { useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

export const useThemeMode = () => {
  const [mode, setMode] = useState('light');

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = createTheme({
    palette: {
      mode,
      ...(mode === 'light'
        ? {
            // light mode palette settings
          }
        : {
            // dark mode palette settings
            background: {
              default: '#303030',
              paper: '#424242',
            },
            text: {
              primary: '#ffffff',
              secondary: '#b0bec5',
            },
          }),
    },
  });

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode');
    if (savedMode) {
      setMode(savedMode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  return { mode, theme, toggleMode };
};