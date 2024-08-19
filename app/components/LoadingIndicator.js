import React, { useState, useEffect } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const quotes = [
    "Everything negative - pressure, challenges - is all an opportunity for me to rise. - Kobe Bryant",
    "Education is the most powerful weapon which you can use to change the world. - Nelson Mandela",
    "There is nothing I would not do for those who are really my friends - Jane Austen",
    "Learning never exhausts the mind. - Leonardo da Vinci",
    "You're braver than you believe, stronger than you seem, and smarter than you think - Winnie the Pooh",
    "The roots of education are bitter, but the fruit is sweet. - Aristotle"
  ];


// Created Loading Indicator compenent so user can see when their flashcards are being generated

function LoadingIndicator() {
    const [quote, setQuote] = useState("");

    useEffect(() => {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        setQuote(quotes[randomIndex]);
    }, []);
    
    
    
    return (
        //To display to user the LoadingIndicator (CircularProgress, Generating flashcards..., and quote)
        <Box sx={{
            display:'flex', 
            flexDirection:'column', 
            alignItems:'center', 
            justifyContent:'center', 
            height: '100vh',
            textAlign: 'center',
            padding: 2
            }}>
            <CircularProgress />
            <Typography variant="h6" sx={{mt: 2}} >
                Generating flashcards...
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, maxWidth:'600px'}}>
                "{quote}"
            </Typography>
        </Box>
    );
}

export default LoadingIndicator;



