import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

// Created Loading Indicator compenent so user can see when their flashcards are being generated

function LoadingIndicator() {
    return (
        <Box sx={{
            display='flex', 
            flexDirection='column', 
            alignItems='center', 
            justifyContent='center', 
            height = '100vh',
            }}>
            <CircularProgress />
            <Typography variant="h6" sx={{marginTop: 2}} >
                Generating flashcards...
            </Typography>
        </Box>
    )
}

export default LoadingIndicator;

