'use client'

import {useUser,  SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { doc, collection, getDoc, setDoc, updateDoc, deleteDoc, getDocs, writeBatch, query, where} from 'firebase/firestore'
import { db } from '/firebase'
import { useRouter } from 'next/navigation'

import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Grid,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CardContent,
  CardActionArea,
  Link,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Flashcard() {
    const { isLoaded, isSignedIn, user } = useUser()
    const [flashcards, setFlashcards] = useState([])
    const [subjects, setSubjects] = useState([])
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [openSubjectDialog, setOpenSubjectDialog] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newFlashcard, setNewFlashcard] = useState({ name: '', subject: '' });
    const [openFlashcardDialog, setOpenFlashcardDialog] = useState(false);
    const [editingFlashcard, setEditingFlashcard] = useState(null);
    const [subjectToDelete, setSubjectToDelete] = useState(null);
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
    const router = useRouter()

    useEffect(() => {
        async function getFlashcardsAndSubjects() {
            if (!user) return

            const docRef = doc(collection(db, 'users'), user.id)
            const docSnap = await getDoc(docRef)

            if (docSnap.exists()) {
                const userData = docSnap.data()
                setFlashcards(userData.flashcards || [])
                setSubjects(userData.subjects || [])
            } else {
                await setDoc(docRef, { flashcards: [], subjects: [] })
            }
        }
        getFlashcardsAndSubjects()
    }, [user])

    const handleAddSubject = async () => {
        if (!newSubject.trim()) return;
        const updatedSubjects = [...subjects, newSubject.trim()];
        setSubjects(updatedSubjects);
        setNewSubject('');

        // Update subjects in Firestore
        const docRef = doc(collection(db, 'users'), user.id);
        await updateDoc(docRef, { subjects: updatedSubjects });
    }

    const handleDeleteSubject = async () => {
        if (!subjectToDelete) return;

        const updatedSubjects = subjects.filter(subject => subject !== subjectToDelete);
        setSubjects(updatedSubjects);

        // Remove the subject from flashcards as well
        const updatedFlashcards = flashcards.map(flashcard => {
            if (flashcard.subject === subjectToDelete) {
                return { ...flashcard, subject: '' }; // Remove the subject
            }
            return flashcard;
        });
        setFlashcards(updatedFlashcards);

        // Update Firestore
        const docRef = doc(collection(db, 'users'), user.id);
        await updateDoc(docRef, { subjects: updatedSubjects });

        // Update all flashcards
        const batch = writeBatch(db);
        updatedFlashcards.forEach((flashcard) => {
            const flashcardRef = doc(db, 'users', user.id, 'flashcards', flashcard.name);
            batch.update(flashcardRef, { subject: flashcard.subject });
        });

        await batch.commit();

        setOpenDeleteConfirmation(false);
        setSubjectToDelete(null);
    }

    const handleAddFlashcard = async () => {
        if (!newFlashcard.name.trim()) return;
    
        let updatedFlashcards;
    
        if (editingFlashcard) {
            // Update flashcard set name and documents in subcollection
            await renameFlashcardSet(editingFlashcard.name, newFlashcard.name);
    
            // Update the flashcard object in local state
            updatedFlashcards = flashcards.map(flashcard =>
                flashcard.name === editingFlashcard.name ? newFlashcard : flashcard
            );
            
            setEditingFlashcard(null);
        } else {
            // Add the new flashcard to Firestore
            const newFlashcardRef = doc(collection(db, 'users', user.id, 'flashcards'), newFlashcard.name);
            await setDoc(newFlashcardRef, newFlashcard);
    
            // Update local state
            updatedFlashcards = [...flashcards, newFlashcard];
        }
    
        setFlashcards(updatedFlashcards);
        setNewFlashcard({ name: '', subject: '' });
        setOpenFlashcardDialog(false);
    
        // Update flashcards in Firestore with the entire updated array
        const docRef = doc(collection(db, 'users'), user.id);
        await updateDoc(docRef, { flashcards: updatedFlashcards });
    }

    const renameFlashcardSet = async (oldName, newName) => {
        try {
            const batch = writeBatch(db);
    
            // Reference to the old subcollection
            const oldCollectionRef = collection(db, 'users', user.id, oldName);
            
            // Reference to the new subcollection
            const newCollectionRef = collection(db, 'users', user.id, newName);
    
            // Get all documents from the old subcollection
            const querySnapshot = await getDocs(oldCollectionRef);
    
            if (querySnapshot.empty) {
                throw new Error(`No documents found in the old collection: ${oldName}`);
            }
    
            // Copy documents to the new subcollection
            querySnapshot.forEach((docSnapshot) => {
                const docData = docSnapshot.data();
                const newDocRef = doc(newCollectionRef, docSnapshot.id); // Correct usage of doc
                batch.set(newDocRef, docData);
            });
    
            // Commit the batch to copy all documents
            await batch.commit();
    
            // Delete the old subcollection documents
            const deletePromises = querySnapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
            await Promise.all(deletePromises);
    
            console.log(`Successfully renamed flashcard set from "${oldName}" to "${newName}".`);
    
        } catch (error) {
            console.error("Error renaming flashcard set:", error.message);
        }
    };
    

    const handleEditFlashcard = (flashcard) => {
        setNewFlashcard(flashcard);
        setEditingFlashcard(flashcard);
        setOpenFlashcardDialog(true);
    }

    const handleCardClick = (id) => {
        router.push(`/flashcard?id=${id}`)
    }

    const filteredFlashcards = flashcards.filter((flashcard) =>
        flashcard.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedSubject === '' || flashcard.subject === selectedSubject)
    );

    if (!isLoaded || !isSignedIn) {
        return <></>
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
                <Grid container spacing={2}>
                    <Grid item xs={9}> {/* Search bar takes up 75% */}
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
                    </Grid>
                    <Grid item xs={3}> {/* Subject filter takes up 25% */}
                        <FormControl fullWidth>
                            <InputLabel>Filter by Subject</InputLabel>
                            <Select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                startAdornment={<InputAdornment position="start"><FilterListIcon /></InputAdornment>}
                            >
                                <MenuItem value="">All Subjects</MenuItem>
                                <MenuItem value="No Subject">No Subject</MenuItem> {/* Option for no subject */}
                                {subjects.map((subject, index) => (
                                    <MenuItem key={index} value={subject}>{subject}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                <Button variant="contained" onClick={() => setOpenSubjectDialog(true)} sx={{ mt: 2 }}>
                    Manage Subjects
                </Button>
                <Button variant="contained" onClick={() => setOpenFlashcardDialog(true)} sx={{ mt: 2, ml: 2 }}>
                    Make New Flashcard Set
                </Button>
            </Box>
            <Grid container spacing={3} sx={{ mt: 4 }}>
                {filteredFlashcards.map((flashcard, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                            <CardActionArea onClick={() => handleCardClick(flashcard.name)}>
                                <CardContent>
                                    <Typography variant="h5" component="div">
                                        {flashcard.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Subject: {flashcard.subject || 'No Subject'}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                            <CardActionArea sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <IconButton onClick={() => handleEditFlashcard(flashcard)}>
                                    <EditIcon />
                                </IconButton>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* Manage Subjects Dialog */}
            <Dialog open={openSubjectDialog} onClose={() => setOpenSubjectDialog(false)}>
                <DialogTitle>Manage Subjects</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="New Subject Name"
                        fullWidth
                        variant="outlined"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                    />
                    <Button onClick={handleAddSubject} sx={{ mt: 2 }}>Add Subject</Button>
                    <List>
                        {subjects.map((subject, index) => (
                            <ListItem key={index}>
                                <ListItemText primary={subject} />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" onClick={() => { setSubjectToDelete(subject); setOpenDeleteConfirmation(true); }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenSubjectDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteConfirmation} onClose={() => setOpenDeleteConfirmation(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete the subject "{subjectToDelete}"? This will remove the subject from all associated flashcards.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteConfirmation(false)}>Cancel</Button>
                    <Button onClick={handleDeleteSubject} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
            {/* Add/Edit Flashcard Dialog */}
            <Dialog open={openFlashcardDialog} onClose={() => setOpenFlashcardDialog(false)}>
                <DialogTitle>{editingFlashcard ? 'Edit Flashcard' : 'Add New Flashcard'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Flashcard Name"
                        fullWidth
                        variant="outlined"
                        value={newFlashcard.name}
                        onChange={(e) => setNewFlashcard({ ...newFlashcard, name: e.target.value })}
                    />
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={newFlashcard.subject}
                            onChange={(e) => setNewFlashcard({ ...newFlashcard, subject: e.target.value })}
                        >
                            <MenuItem value="">No Subject</MenuItem> {/* Option for no subject */}
                            {subjects.map((subject, index) => (
                                <MenuItem key={index} value={subject}>{subject}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFlashcardDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddFlashcard}>{editingFlashcard ? 'Update' : 'Add'}</Button>
                </DialogActions>
            </Dialog>
        </Container>
    )
}
