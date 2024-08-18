'use client'

import { useState } from 'react'
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  AppBar,
  Toolbar,
  Card,
  Dialog, 
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CardContent,
  CardActionArea,
  Link,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  FormControl,
  InputLabel,
  Alert
} from '@mui/material'

import {db} from '/firebase' 
import {
  collection,
  doc,
  writeBatch,
  getDoc,
} from 'firebase/firestore';

import { useRouter } from 'next/navigation';
import {useUser,  SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Generate() {
  const {isLoaded, isSignedIn, user} = useUser()
  const [flashcards, setFlashcards] = useState([])
  const [flipped, setFlipped] = useState([])
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(false)
  const [numFlashcards, setNumFlashcards] = useState('');
  const [flashcardTypes, setFlashcardTypes] = useState([]);
  const [alertOpen, setAlertOpen] = useState(false); // State to control alert visibility
  const router = useRouter()

  const availableFlashcardTypes = [
    'Definition',
    'Question-Answer',
    'Fill-in-the-blank',
    'True/False',
    'Concept explanation',
  ];

  const handleSubmit = async () => {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text,
              numFlashcards: numFlashcards,
              flashcardTypes: flashcardTypes }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate flashcards');
        }

        const data = await response.json();
        setFlashcards(data);
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate flashcards. Please try again.');
    }
}

  const handleCardClick = (id) => (
    setFlipped((prev) => ({
     ...prev, 
       [id]: !prev[id], 
    }))
  )

  const dialogOpen = () => {
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
  }

  const handleCloseAlert = () => {
    setAlertOpen(false);
  };

  const saveFlashcards = async () => {
    if (!isSignedIn) { // Check if the user is signed in
      setAlertOpen(true); // Show the alert if not signed in
      return;
    }
  
    if (!name) {
      alert('Please enter a name');
      return;
    }
  
    const batch = writeBatch(db);
    const userDocRef = doc(collection(db, 'users'), user.id);
    const docSnap = await getDoc(userDocRef);
  
    if (docSnap.exists()) {
      const collections = docSnap.data().flashcards || [];
      if (collections.find((f) => f.name === name)) {
        alert('Flashcard Collection With That Name Exists');
        return;
      } else {
        collections.push({ name });
        batch.set(userDocRef, { flashcards: collections }, { merge: true });
      }
    } else {
      batch.set(userDocRef, { flashcards: [{ name }] });
    }
  
    const colRef = collection(userDocRef, name); 
    flashcards.forEach((flashcard) => {
      const cardDocRef = doc(colRef);
      batch.set(cardDocRef, flashcard);
    });
  
    await batch.commit();
    handleCloseDialog();
    router.push('/flashcards');
  };
  

  return (
   <Container maxWidth="100vw"  sx={{background:'linear-gradient(#FCF1F3 10%, #FFD9E1 90%)', height: '100vw'}}>
      <AppBar position="static" sx={{ backgroundColor: 'primary.bar' }}>
        <Toolbar>
        <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
              <Typography sx={{color: 'primary.main'}} variant="h6" component="span">Flashcard SaaS</Typography>
          </Link>
          <Button variant="contained" sx={{mr:2, bgcolor:'primary.bar', color: 'primary.main'}} href="https://forms.gle/BaPiXZKKKfa5Dk2X7">Feedback</Button>
          <SignedOut>
            <Button variant="contained" sx={{mr:2,  bgcolor:'primary.bar', color: 'primary.main'}} href="/sign-in">Sign In</Button>
            <Button variant="contained" href="/sign-up" sx={{ bgcolor:'primary.bar', color: 'primary.main'}}>Sign Up</Button>
          </SignedOut>

          <SignedIn>
            <Button variant="contained" sx={{mr:2}} href="/generate">Generate</Button>
            <Button variant="contained" sx={{mr:2}} href="/flashcards">Flashcards</Button>
            <UserButton />
          </SignedIn>
        </Toolbar>
      </AppBar>
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom
        sx={{mt:8,textAlign:'center', color:'primary.main', fontWeight:'bold', textShadow:'2px 3px 2px pink'}}>
          Generate Flashcards
        </Typography>
        <>
      <TextField
        fullWidth
        label="Number of Flashcards. If unsure, leave blank and AI will decide for you."
        type="number"
        value={numFlashcards}
        onChange={(e) => setNumFlashcards(e.target.value)}
        sx={{ mb: 2, mt: 2 }}
      />
      
      <FormControl fullWidth sx={{ mb: 2, minWidth: 200 }}>
        <InputLabel id="flashcard-types-label">Flashcard Types</InputLabel>
        <Select
          labelId="flashcard-types-label"
          multiple
          value={flashcardTypes}
          onChange={(e) => setFlashcardTypes(e.target.value)}
          input={<OutlinedInput label="Flashcard Types" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} />
              ))}
            </Box>
          )}
        >
          {availableFlashcardTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <TextField
        value={text}
        onChange={(e) => setText(e.target.value)}
        label="Enter text"
        fullWidth
        multiline
        rows={4}
        variant="outlined"
        sx={{ mb: 2 }}
      />
    </>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          fullWidth
          sx={{bgcolor: 'secondary.main', color: 'white', mt:3}}
        >
          Generate Flashcards
        </Button>
      </Box>
      
      {flashcards.length > 0 && (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h5" component="h2" gutterBottom>
      Generated Flashcards
    </Typography>
    <Grid container spacing={2}>
      {flashcards.map((flashcard, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card>
          <CardActionArea onClick={()=>(
            handleCardClick(index)
          )}>
            <CardContent>
              <Box sx={{
                perspective: '1000px',
                '& > div': {
                  transition: 'transform 0.6s',
                  transformStyle: 'preserve-3d', 
                  position: 'relative', 
                  width: '100%', 
                  height: '208px', 
                  boxShadow: '0 4px 8px 8 rgba(0,0,0, 0.2)', 
                  transform: flipped[index]
                  ? 'rotateY(180deg)' 
                  : 'rotateY(0deg)', 
                },'& > div > div:nth-of-type(2)':{ 
                  transform: 'rotateY(180deg)' 
                }, '& > div > div': { 
                  position: 'absolute', 
                  width: '100%', 
                  height: '100%', 
                  backfaceVisibility: 'hidden', 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 2,
                  boxSizing: 'border-box',
                },  
              }}>
                <div>
                  <div>
                    <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>{flashcard.front}
                    </Typography>
                    </div>
                    <div>
                    <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>{flashcard.back}
                    </Typography>
                    </div>
                  </div>
                  </Box>
            </CardContent>
          </CardActionArea>
          </Card>
        </Grid>
      ))}
      </Grid>
        <Box  sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpen(true)}
          >
          Save
          </Button>
          </Box>
  </Box>
)}
    <Dialog open={open} onClose={handleCloseDialog}>
      <DialogTitle>Save Flashcard Set</DialogTitle>
      <DialogContent>
      <DialogContentText>
      Please enter a name for your flashcard set.
    </DialogContentText>
    <TextField
      autoFocus
      margin="dense"
      label="Set Name"
      type="text"
      fullWidth
      value={name}
      onChange={(e) => setName(e.target.value)}>
        </TextField>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleCloseDialog}>Cancel</Button>
    <Button onClick={saveFlashcards} color="primary">
      Save
    </Button>
  </DialogActions>
</Dialog>

      {/* Alert for not being signed in */}
      <Dialog open={alertOpen} onClose={handleCloseAlert}>
        <DialogTitle>Not Signed In</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You need to be signed in to save your flashcards. Please sign in or create an account and try generating the cards again.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAlert}>Close</Button>
          <Button onClick={() => router.push('/sign-in')} color="primary">
            Sign In
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
