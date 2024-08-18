'use client'

import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useState } from 'react'
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Grid,
  Link,
} from '@mui/material'
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/nextjs";
import getStripe from "../utils/get-stripe";
import Head from 'next/head'

export default function Home(){
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (tier) => {
    if (!isSignedIn && tier !== 'free') {
      router.push('/sign-in');
      return;
    }

    try {
      const checkoutSession = await fetch('/api/checkout_session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tier }),
      });
  
      const checkoutSessionJson = await checkoutSession.json();
  
      if (checkoutSession.status === 500) {
        console.error(checkoutSessionJson.error.message);
        return;
      }
  
      const stripe = await getStripe();
      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutSessionJson.id,
      });
  
      if (error) {
        console.warn(error.message);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="100vw">
        <Head>
          <title>Flashcard SaaS</title>
          <meta name="description" content="Create flashcards from your text"/>
        </Head>

        <Box  sx={{background:'linear-gradient(#FCF1F3 10%, #FFD9E1 90%)', mx: -3}}>
  
        <AppBar sx={{bgcolor: 'primary.bar'}} position="static">
          <Toolbar>
            <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
              <Typography sx={{color: 'primary.main'}} variant="h6" component="span">Flashcard SaaS</Typography>
            </Link>
            <Button variant="outline" sx={{ color: 'primary.main', mr:2}} href="https://forms.gle/BaPiXZKKKfa5Dk2X7">Feedback</Button>
            <SignedOut>
              <Button variant="outline" sx={{color: 'primary.main',mr:2}} href="/sign-in">Sign In</Button>
              <Button variant="outline" sx={{color: 'primary.main'}} href="/sign-up">Sign Up</Button>
            </SignedOut>
  
            <SignedIn>
              <Button variant="contained" sx={{mr:2}} href="/generate">Generate</Button>
              <Button variant="contained" sx={{mr:2}} href="/flashcards">Flashcards</Button>
              <UserButton />
            </SignedIn>
          </Toolbar>
        </AppBar>
  
        <Box sx={{textAlign: 'center', mt: 13, mb: 6}}>
          <Typography variant="h1" gutterBottom sx={{textShadow:'2px 3px 2px pink', fontWeight: 'bold', color: 'white', mb:-3}}>Welcome to</Typography>
          <Typography variant="h1" gutterBottom sx={{textShadow:'2px 3px 2px pink', fontWeight: 'bold', fontStyle:"oblique", color: 'white'}}>Flashcard SaaS</Typography>
          <Typography variant="h5" gutterBottom sx={{ color: 'secondary.main' }}>
            The easiest way to make flashcards from your text
          </Typography>
          <Button variant="contained" size="large" sx={{bgcolor:'secondary.main', color:'white', mt:4, mb: 8}} href="/generate">Get Started</Button>
        </Box>
        </Box>

        <Box sx={{my:12}}>
          <Typography variant="h3" component="h2" gutterBottom sx={{
            textAlign: 'center',
            color: 'secondary.main',
            fontWeight:'bold',
            mb:3 }}>
            Features
          </Typography>
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'primary.bar', 
                borderRadius: 2, 
                height: '100%', 
                transition: 'transform 0.3s', 
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: '3px 3px 2px #FF7B93',
              }}>
                <Typography variant='h6' gutterBottom sx={{ color: 'primary.main' }}>Smart Flashcards</Typography>
                <Typography>
                  Our AI intelligently breaks down your text into concise flashcards, perfect for studying.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'primary.bar', 
                borderRadius: 2, 
                height: '100%', 
                transition: 'transform 0.3s', 
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: '3px 3px 2px #FF7B93',
              }}>
                <Typography variant='h6' gutterBottom sx={{ color: 'primary.main' }}>Accessible Anywhere</Typography>
                <Typography>
                  Access your flashcards from any device, at any time. Study on the go with ease.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ 
                p: 3, 
                bgcolor: 'primary.bar', 
                borderRadius: 2 , 
                height: '100%', 
                transition: 'transform 0.3s', 
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: '3px 3px 2px #FF7B93',
                
              }}>
                <Typography variant='h6' gutterBottom sx={{ color: 'primary.main' }}>Easy Text Input</Typography>
                <Typography>
                  Simply input your text and let our software do the rest. Creating flashcards has never been easier.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ bgcolor: 'cards.bg', my: 8, mx:-3, textAlign: 'center'}}>
          <Typography variant="h3" gutterBottom sx={{
            pb:8, pt: 11,
            color: 'primary.main',
            fontWeight:'bold',
          }}
          >Pricing</Typography>
          <Grid container spacing={6} sx={{pb:14}}>
            <Grid item xs={12} md={4}>
              
              <Box sx={{
                p: 4,
                bgcolor: 'cards.box',
                color: 'white',
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: 3,
                ml:3,

                
              }}>
                <Box sx={{p:3,mb:-5, bgcolor:'cards.focused', borderRadius:2}}>
                <Typography variant='h5' gutterBottom sx={{fontWeight:'bold', color: 'primary.bar' }}>Free</Typography>
                <Typography variant="h6" gutterBottom>$0 / month</Typography>
                <Typography>
                  Access to some flashcard features and limited storage
                </Typography>
                
              </Box>
              <Button variant="contained" sx={{ mt:3, bgcolor: 'secondary.main',color:'white'}} onClick={() => handleSubmit('free')}>Choose Free</Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
            <Box sx={{
                p: 4,
                bgcolor: 'cards.box',
                color: 'white',
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: 3,
                ml:3,                
              }}>
                <Box sx={{p:3,mb:-5, bgcolor:'cards.focused', borderRadius:2}}>
                
                <Typography variant='h5' gutterBottom sx={{fontWeight:'bold',  color: 'primary.bar' }}>Basic</Typography>
                <Typography variant="h6" gutterBottom>$5 / month</Typography>
                <Typography>
                  Access to basic flashcard features and limited storage
                </Typography>

              </Box>
              <Button variant="contained" sx={{ mt:3, bgcolor: 'secondary.main',color:'white'}} onClick={() => handleSubmit('basic')}>
              {isSignedIn ? 'Choose Basic' : 'Sign In to Subscribe'}
              </Button>
              
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
            <Box sx={{
                p: 4,
                bgcolor: 'cards.box',
                color: 'white',
                borderRadius: 2,
                height: '100%',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'translateY(-5px)' },
                boxShadow: 3,
                ml:3,                
              }}>
                <Box sx={{p:3,mb:-5, bgcolor:'cards.focused', borderRadius:2}}>
                <Typography variant='h5' gutterBottom sx={{fontWeight:'bold',  color: 'primary.bar' }}>Pro</Typography>
                <Typography variant="h6" gutterBottom>$10 / month</Typography>
                <Typography>
                  Unlimited flashcards and storage, with priority support
                </Typography>
                
              </Box>
              <Button variant="contained" sx={{ mt:3, bgcolor: 'secondary.main',color:'white'}} onClick={() => handleSubmit('pro')}>
                  {isSignedIn ? 'Choose Pro' : 'Sign In to Subscribe'}
              </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}