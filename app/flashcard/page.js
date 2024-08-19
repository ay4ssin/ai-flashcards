'use client';

import {useUser,  SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useEffect, useState } from 'react';
import { doc, getDocs, collection, addDoc, deleteDoc, writeBatch, getDoc} from 'firebase/firestore';
import { db } from '/firebase';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  AppBar,
  Toolbar,
  CardContent,
  CardActionArea,
  Link,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

function AddFlashcardForm({ isOpen, onClose, onAdd }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(front, back);
    setFront('');
    setBack('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>Add New Flashcard</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Front"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Back"
            value={back}
            onChange={(e) => setBack(e.target.value)}
            margin="normal"
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmationDialog({ isOpen, onClose, onConfirm, title, content }) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Flashcard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [flashcards, setFlashcards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [deleteCardConfirm, setDeleteCardConfirm] = useState({ open: false, id: null });
  const [deleteSetConfirm, setDeleteSetConfirm] = useState(false);
  const [isStudyModeOpen, setStudyModeOpen] = useState(false);

  const searchParams = useSearchParams();
  const search = searchParams.get('id');
  const router = useRouter();

  useEffect(() => {
    async function getFlashcard() {
      if (!user || !search) return;

      const docRef = collection(doc(collection(db, 'users'), user.id), search);
      const docs = await getDocs(docRef);
      const flashcards = [];

      docs.forEach((doc) => {
        flashcards.push({ id: doc.id, ...doc.data() });
      });
      setFlashcards(flashcards);
    }
    getFlashcard();
  }, [user, search]);

  const handleCardClick = (id) => {
    setFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddFlashcard = async (front, back) => {
    if (!user || !search) return;

    const docRef = collection(doc(collection(db, 'users'), user.id), search);
    const newFlashcard = await addDoc(docRef, { front, back });
    setFlashcards([...flashcards, { id: newFlashcard.id, front, back }]);
  };

  const handleDeleteFlashcard = async (id) => {
    if (!user || !search) return;

    const docRef = doc(collection(doc(collection(db, 'users'), user.id), search), id);
    await deleteDoc(docRef);
    setFlashcards(flashcards.filter((flashcard) => flashcard.id !== id));
    setDeleteCardConfirm({ open: false, id: null });
  };

function deleteFlashcardSet(flashcards, setToDelete) {
  const setIndex = flashcards.findIndex(set => set.name === setToDelete);
  if (setIndex !== -1) {
    flashcards.splice(setIndex, 1);
  }
  return flashcards;
}

const handleDeleteSet = async () => {
  if (!user || !search) return;

  try {
    const batch = writeBatch(db);

    // Reference to the user document
    const userDocRef = doc(db, 'users', user.id);

    // Fetch the current user document
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      console.error("User document not found");
      return;
    }

    const userData = userDoc.data();
    let flashcards = userData.flashcards || [];

    // Remove the current set from the flashcards array
    flashcards = deleteFlashcardSet(flashcards, search);

    // Update the user document with the new flashcards array
    batch.update(userDocRef, { flashcards });

    // Delete all flashcards in the set
    const flashcardsRef = collection(userDocRef, search);
    const flashcardDocs = await getDocs(flashcardsRef);
    flashcardDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Commit the batch
    await batch.commit();

    console.log("Flashcard set deleted successfully");
    setDeleteSetConfirm(false);
    router.push('/flashcards');
  } catch (error) {
    console.error("Error deleting flashcard set:", error);
    // Handle the error (e.g., show an error message to the user)
  }
};

  const filteredFlashcards = flashcards.filter(
    (flashcard) =>
      flashcard.front.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flashcard.back.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isLoaded || !isSignedIn) {
    return <></>;
  }
  
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function StudyMode({ isOpen, onClose, flashcards }) {
    const [shuffledCards, setShuffledCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [cardProgress, setCardProgress] = useState({});
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState('');
  
    useEffect(() => {
      // Shuffle cards when the study mode opens
      if (isOpen) {
        const shuffled = shuffleArray(flashcards);
        setShuffledCards(shuffled);
        setCurrentCardIndex(0);
        
        // Initialize progress for each card
        const initialProgress = {};
        shuffled.forEach(card => {
          initialProgress[card.id] = 0;
        });
        setCardProgress(initialProgress);
      }
    }, [isOpen, flashcards]);
  
    const currentCard = shuffledCards[currentCardIndex];
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      try {
        const response = await fetch('/api/studymode', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flashcard: currentCard,
            userAnswer: userInput
          }),
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
  
        if (data.isCorrect) {
          setCardProgress(prev => ({
            ...prev,
            [currentCard.id]: prev[currentCard.id] + 1
          }));
          setFeedback(`Correct! ${data.explanation}`);
        } else {
          setFeedback(`Incorrect. ${data.explanation} ${data.suggestion}`);
        }
  
        setUserInput('');
  
        // Move to next card if all cards haven't been answered correctly 3 times
        if (!Object.values(cardProgress).every(progress => progress >= 3)) {
          setCurrentCardIndex((prevIndex) => (prevIndex + 1) % shuffledCards.length);
        }
      } catch (error) {
        console.error('Error:', error);
        setFeedback('An error occurred while evaluating your answer. Please try again.');
      }
    };
  
    const isSessionComplete = Object.values(cardProgress).every(progress => progress >= 3);
  
    if (isSessionComplete) {
      return (
        <Dialog open={isOpen} onClose={onClose}>
          <DialogTitle>Study Session Complete!</DialogTitle>
          <DialogContent>
            <Typography>Congratulations! You've answered all flashcards correctly 3 times.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </Dialog>
      );
    }
  
    if (!currentCard) {
      return null; // or some loading state
    }
  
    return (
      <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>Study Mode</DialogTitle>
        <DialogContent>
          <Typography variant="h6">{currentCard.front}</Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              margin="normal"
              label="Your answer"
            />
            <Button type="submit" variant="contained" color="primary">
              Submit
            </Button>
          </form>
          <Typography color={feedback.startsWith("Correct") ? "success.main" : "error.main"}>{feedback}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Exit Study Mode</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
     <Container maxWidth="100vw"  sx={{background:'linear-gradient(#FCF1F3 10%, #FFD9E1 90%)', height: '100vw'}}>
      <AppBar position="static" sx={{ backgroundColor: 'primary.bar' }}>
        <Toolbar>
        <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
              <Typography sx={{color: 'primary.main'}} variant="h6" component="span">StudyBunny</Typography>
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
      <Box sx={{ mt: 4, mb: 4 }}>
        <TextField
          fullWidth
          label="Search Flashcards"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
      <Button variant="contained" color="primary" onClick={() => setIsAddFormOpen(true)}>
        Add Flashcard
      </Button>
      <Button variant="contained" color="secondary" onClick={() => setStudyModeOpen(true)}>
         Study Mode
        </Button>
       <Button variant="contained" color="secondary" onClick={() => setDeleteSetConfirm(true)}>
        Delete Set
        </Button>
        </Box>
      <Grid container spacing={3}>
        {filteredFlashcards.map((flashcard, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardActionArea onClick={() => handleCardClick(flashcard.id)}>
              <CardContent>
                  <Box
                    sx={{
                      perspective: '1000px',
                      '& > div': {
                        transition: 'transform 0.6s',
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                        width: '100%',
                        height: '208px',
                        boxShadow: '0 4px 8px 8 rgba(0,0,0, 0.2)',
                        transform: flipped[flashcard.id]
                          ? 'rotateY(180deg)'
                          : 'rotateY(0deg)',
                      },
                      '& > div > div:nth-of-type(2)': {
                        transform: 'rotateY(180deg)',
                      },
                      '& > div > div': {
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
                    }}
                  >
                    <div>
                      <div>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {flashcard.front}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="h5" component="div" sx={{ textAlign: 'center' }}>
                          {flashcard.back}
                        </Typography>
                      </div>
                    </div>
                  </Box>
                </CardContent>
              </CardActionArea>
              <Button
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteCardConfirm({ open: true, id: flashcard.id })}
                color="error"
              >
                Delete
              </Button>
            </Card>
          </Grid>
        ))}
      </Grid>
      <AddFlashcardForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onAdd={handleAddFlashcard}
      />
      <ConfirmationDialog
        isOpen={deleteCardConfirm.open}
        onClose={() => setDeleteCardConfirm({ open: false, id: null })}
        onConfirm={() => handleDeleteFlashcard(deleteCardConfirm.id)}
        title="Delete Flashcard"
        content="Are you sure you want to delete this flashcard?"
      />
      <ConfirmationDialog
        isOpen={deleteSetConfirm}
        onClose={() => setDeleteSetConfirm(false)}
        onConfirm={handleDeleteSet}
        title="Delete Flashcard Set"
        content="Are you sure you want to delete this entire flashcard set? This action cannot be undone."
      />
      <StudyMode
      isOpen={isStudyModeOpen}
      onClose={() => setStudyModeOpen(false)}
      flashcards={flashcards}
    />
    </Container>
  );
}
