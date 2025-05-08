import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
    Box,
    Typography,
    TextField,
    Button,
    Alert,
    AppBar,
    Toolbar,
} from '@mui/material';
import { login } from '../api/auth';
import { jwtDecode } from 'jwt-decode';


interface Claims {
    roles: string[];
}


function LoginPage() {
    console.log("LoginPage rendered");
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const mutation = useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) =>
            login(username, password),
        onSuccess: (token) => {
            localStorage.setItem('token', token);
            const decoded = jwtDecode<Claims>(token);
            const roles = decoded.roles || [];
            if (roles.includes('admin')) {
                navigate('/admin');
            } else if (roles.includes('end_user_manager') || roles.includes('end_user_readonly')) {
                navigate('/user');
            } else {
                setError('Unauthorized role');
            }
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Login failed');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Email and password are required');
            return;
        }
        mutation.mutate({ username: email, password });
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: '#f8f9fc',
                fontFamily: '"Public Sans", "Noto Sans", sans-serif',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <AppBar
                position="static"
                sx={{
                    bgcolor: '#fff',
                    borderBottom: '1px solid #e7ecf4',
                    px: 10,
                    py: 3,
                }}
            >
                <Toolbar sx={{ justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0d131c' }}>
                        <Box sx={{ width: 16, height: 16 }}>
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <g clip-path="url(#clip0_6_330)">
                                    <path
                                        fillRule="evenodd"
                                        clipRule="evenodd"
                                        d="M24 0.757355L47.2426 24L24 47.2426L0.757355 24L24 0.757355ZM21 35.7574V12.2426L9.24264 24L21 35.7574Z"
                                        fill="currentColor"
                                    />
                                </g>
                                <defs>
                                    <clipPath id="clip0_6_330">
                                        <rect width="48" height="48" fill="white" />
                                    </clipPath>
                                </defs>
                            </svg>
                        </Box>
                        <Typography
                            variant="h6"
                            sx={{ color: '#0d131c', fontWeight: 'bold', fontSize: 18, lineHeight: 'tight' }}
                        >
                            VT DroneZone
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        sx={{
                            bgcolor: '#0d65f2',
                            color: '#f8f9fc',
                            fontWeight: 'bold',
                            fontSize: 14,
                            px: 4,
                            py: 1,
                            borderRadius: 2,
                            minWidth: 84,
                            maxWidth: 480,
                            '&:hover': { bgcolor: '#0d65f2' },
                        }}
                        onClick={() => navigate('/register')}
                    >
                        Sign up
                    </Button>
                </Toolbar>
            </AppBar>
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    py: 5,
                    px: 40,
                }}
            >
                <Box sx={{ maxWidth: 512, width: '100%', py: 5 }}>
                    <Box sx={{ '@media (min-width: 480px)': { p: 4 } }}>
                        <Box
                            sx={{
                                minHeight: 300,
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: { xs: 6, sm: 8 },
                                backgroundImage:
                                    'linear-gradient(rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%), url("/images/coolagdrone.jpg")',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                borderRadius: { xs: 0, sm: 2 },
                                alignItems: 'flex-start',
                                justifyContent: 'flex-end',
                                px: { xs: 4, sm: 10 },
                                pb: 10,
                            }}
                        >
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                                <Typography
                                    variant="h3"
                                    sx={{
                                        color: '#fff',
                                        fontWeight: 900,
                                        fontSize: { xs: 32, sm: 40 },
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Log in below
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#fff',
                                        fontSize: { xs: 14, sm: 16 },
                                        fontWeight: 'normal',
                                    }}
                                >
                                    Log in to your VT DroneZone account
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={{ maxWidth: 480, display: 'flex', flexWrap: 'wrap', gap: 4, px: 4, py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 160, flex: 1 }}>
                            <Typography
                                variant="body1"
                                sx={{ color: '#0d131c', fontWeight: 'medium', pb: 2, fontSize: 16 }}
                            >
                                Email
                            </Typography>
                            <TextField
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f8f9fc',
                                        color: '#0d131c',
                                        fontSize: 16,
                                        height: 56,
                                        p: 2,
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: '#49699c',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#ced8e8',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ maxWidth: 480, display: 'flex', flexWrap: 'wrap', gap: 4, px: 4, py: 3 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 160, flex: 1 }}>
                            <Typography
                                variant="body1"
                                sx={{ color: '#0d131c', fontWeight: 'medium', pb: 2, fontSize: 16 }}
                            >
                                Password
                            </Typography>
                            <TextField
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                fullWidth
                                sx={{
                                    '& .MuiInputBase-root': {
                                        borderRadius: 2,
                                        bgcolor: '#f8f9fc',
                                        color: '#0d131c',
                                        fontSize: 16,
                                        height: 56,
                                        p: 2,
                                    },
                                    '& .MuiInputBase-input::placeholder': {
                                        color: '#49699c',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#ced8e8',
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                    {error && (
                        <Alert severity="error" sx={{ mx: 4, mt: 2, fontSize: 14 }}>
                            {error}
                        </Alert>
                    )}
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#49699c',
                            fontSize: 14,
                            textAlign: 'center',
                            pb: 3,
                            pt: 1,
                            px: 4,
                            textDecoration: 'underline',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/password-reset')}
                    >
                        Forgot your password?
                    </Typography>
                    <Box sx={{ px: 4, py: 3 }}>
                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            sx={{
                                bgcolor: '#0d65f2',
                                color: '#f8f9fc',
                                fontWeight: 'bold',
                                fontSize: 14,
                                px: 4,
                                py: 1,
                                borderRadius: 2,
                                height: 40,
                                '&:hover': { bgcolor: '#0d65f2' },
                            }}
                            onClick={handleSubmit}
                            disabled={mutation.isPending}
                        >
                            Login
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default LoginPage;