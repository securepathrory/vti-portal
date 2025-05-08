import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getAdminData } from '../api/auth';

function AdminPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  const { data, error: queryError, isLoading } = useQuery({
    queryKey: ['adminData'],
    queryFn: getAdminData,
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
    if (queryError) {
      const axiosError = queryError as AxiosError;
      const message = axiosError.response?.status === 401 ? 'Session expired, please log in again' : 'Failed to fetch admin data';
      setError(message);
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  }, [token, queryError, navigate]);

  if (isLoading) {
    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 2 }}>
          <Typography>Loading...</Typography>
        </Box>
    );
  }

  return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {data && <Typography>{data.message}</Typography>}
      </Box>
  );
}

export default AdminPage;