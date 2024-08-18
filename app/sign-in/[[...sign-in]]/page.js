import { AppBar, Container, Toolbar, Typography, Button, Box } from "@mui/material"
import Link from 'next/link'
import { SignIn } from "@clerk/nextjs"

export default function SignUpPage() {
    return <Container maxWidth="100vw"  sx={{background:'linear-gradient(#FCF1F3 10%, #FFD9E1 90%)', height: '100vw'}}>
        <Box sx={{}}>
        <AppBar position="static" sx={{ backgroundColor: 'primary.bar' }}>
            <Toolbar>
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        color: 'primary.main'
                    }}
                >
                    Flashcard SaaS
                </Typography>
                <Button color="inherit" sx={{color: 'white'}}>
                    <Link href="/sign-in" passHref>
                        Login
                    </Link>
                </Button>
                <Button color="inherit" sx={{color: 'white'}}>
                    <Link href="/sign-up" passHref>
                        Sign Up
                    </Link>
                </Button>
            </Toolbar>

        </AppBar>
        

        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center"
          justifyContent="center"
          sx={{mt:8, color: 'primary.main'}}
        >
            <Typography variant="h3" sx={{mb:2,fontWeight:'bold', textShadow:'2px 3px 2px pink'}}>Sign In</Typography>
            <SignIn/>
        </Box>
        </Box>
    </Container>
}

