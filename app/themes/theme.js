'use client';

import React from "react";
import { ThemeProvider, createTheme } from '@mui/material';


const theme = createTheme({
  palette: {
    primary: {
      main: '#FF7B93', // Darker pink for buttons and AppBar
      bar: '#FFD9E1', 
    },
    secondary:{
      main: '#F69A27',
      second: '#FFBE77',
    },
    background: {
      one: '#FCECEE', // Baby pink for background
      two: '#FFD8E1',
    },
    cards: {
      bg: '#FEC7D2',
      box: '#FFA4B5',
      focused: '#FF8AA1',
    }
  },
  typography: {
    fontFamily: '"Apple Color Emoji"',
    h2: {
      fontWeight: 'bold',
    },
    h4: {
      fontWeight: 'bold',
    },
    h6: {
      fontWeight: 'bold',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: '0 3px 5px 2px rgba(255, 105, 180, .3)',
          '&:hover': {
            transform: 'translateY(-2px)',
            transition: 'transform 0.3s',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;