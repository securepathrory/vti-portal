import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '../api/auth';

function PasswordResetRequest() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const mutation = useMutation({
        mutationFn: requestPasswordReset,
        onSuccess: (resetLink) => {
            setSuccess('Password reset email sent. Check your inbox (or use the link for testing: ' + resetLink + ')');
            setError('');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to request password reset');
            setSuccess('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) {
            setError('Username is required');
            return;
        }
        mutation.mutate(username);
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#005670' }}>
                Password Reset Request
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    Request Reset
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

export default PasswordResetRequest;