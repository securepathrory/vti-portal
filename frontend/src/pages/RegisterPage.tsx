import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { register } from '../api/auth';

function RegisterPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mutation = useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) =>
            register(username, password),
        onSuccess: () => {
            setSuccess('Registration successful! You can now log in.');
            setError('');
            setTimeout(() => navigate('/'), 3000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Registration failed');
            setSuccess('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            setError('Email and password are required');
            return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(username)) {
            setError('Please enter a valid email address');
            return;
        }
        mutation.mutate({ username, password });
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#005670' }}>
                Register
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    sx={{ input: { color: '#005670' }, label: { color: '#005670' } }}
                />
                <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    sx={{ input: { color: '#005670' }, label: { color: '#005670' } }}
                />
                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, bgcolor: '#F58220', '&:hover': { bgcolor: '#e06e1c' } }}
                    disabled={mutation.isPending}
                >
                    Register
                </Button>
                <Button
                    variant="text"
                    fullWidth
                    sx={{ mt: 1, color: '#005670' }}
                    onClick={() => navigate('/')}
                >
                    Back to Login
                </Button>
            </form>
        </Box>
    );
}

export default RegisterPage;