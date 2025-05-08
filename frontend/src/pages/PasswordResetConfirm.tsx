import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { confirmPasswordReset } from '../api/auth';

function PasswordResetConfirm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Invalid or missing reset token');
        }
    }, [searchParams]);

    const mutation = useMutation({
        mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
            confirmPasswordReset(token, newPassword),
        onSuccess: () => {
            setSuccess('Password reset successful. You can now log in.');
            setError('');
            setTimeout(() => navigate('/'), 3000);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to reset password');
            setSuccess('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Invalid or missing reset token');
            return;
        }
        if (!newPassword) {
            setError('New password is required');
            return;
        }
        mutation.mutate({ token, newPassword });
    };

    return (
        <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#005670' }}>
                Reset Password
            </Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                    Reset Password
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

export default PasswordResetConfirm;