import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAdminData } from '../api/auth';

function AdminPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  const { data, error: queryError } = useQuery({
    queryKey: ['adminData'],
    queryFn: () => getAdminData(token),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
    if (queryError) {
      setError(queryError.message || 'Failed to fetch admin data');
    }
  }, [token, queryError, navigate]);

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
