import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert, Grid, Paper, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { getUserData } from '../api/auth';
import { House, InsertDriveFile, Folder, CreditCard, Article, Person, Settings, Help } from '@mui/icons-material';

function UserPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  const { data, error: queryError } = useQuery({
    queryKey: ['userData'],
    queryFn: getUserData,
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
    if (queryError) {
      const axiosError = queryError as AxiosError;
      const message = axiosError.response?.status === 401 ? 'Session expired, please log in again' : 'Failed to fetch user data';
      setError(message);
      if (axiosError.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
      }
    }
  }, [token, queryError, navigate]);

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
        {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
        )}
        <Box sx={{ display: 'flex', flex: 1 }}>
          {/* Navigation Menu */}
          <Box sx={{ width: 320, bgcolor: '#f8f9fc', p: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Typography variant="h6" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
              Insurance
            </Typography>
            <List>
              <ListItem sx={{ bgcolor: '#e7ecf4', borderRadius: 2, py: 1, px: 3 }}>
                <ListItemIcon>
                  <House sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Overview" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <InsertDriveFile sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Policies" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <Folder sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Claims" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <CreditCard sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Payments" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <Article sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Documents" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
            </List>
            <List>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <Person sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Profile" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <Settings sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Settings" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
              <ListItem sx={{ py: 1, px: 3 }}>
                <ListItemIcon>
                  <Help sx={{ color: '#0d131c' }} />
                </ListItemIcon>
                <ListItemText primary="Help & Support" sx={{ '& .MuiListItemText-primary': { color: '#0d131c', fontSize: '0.875rem', fontWeight: 'medium' } }} />
              </ListItem>
            </List>
          </Box>
          {/* Main Content */}
          <Box sx={{ flex: 1, maxWidth: 960, p: 4 }}>
            <Typography variant="h4" sx={{ color: '#0d131c', fontWeight: 'bold', mb: 3 }}>
              Welcome, John
            </Typography>
            <Typography variant="h6" sx={{ color: '#0d131c', fontWeight: 'bold', mb: 2, pt: 2 }}>
              Activity
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, border: '1px solid #ced8e8', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
                    Quotes
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#0d131c', fontWeight: 'bold' }}>
                    +20%
                  </Typography>
                  {/* Placeholder for chart */}
                  <Box sx={{ height: 180, bgcolor: '#e7ecf4', mt: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Jan 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Feb 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Mar 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Apr 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>May 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Jun 1</Typography>
                    <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.8125rem', fontWeight: 'bold' }}>Jul 1</Typography>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, border: '1px solid #ced8e8', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
                    Renewals
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#0d131c', fontWeight: 'bold' }}>
                    +10%
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, border: '1px solid #ced8e8', borderRadius: 2 }}>
                  <Typography variant="body1" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
                    Upcoming renewals
                  </Typography>
                  <Typography variant="h4" sx={{ color: '#0d131c', fontWeight: 'bold' }}>
                    +5%
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            <Typography variant="h6" sx={{ color: '#0d131c', fontWeight: 'bold', mt: 4, mb: 2, pt: 2 }}>
              News
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8f9fc', p: 2 }}>
                <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      bgcolor: 'grey.300',
                      backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/32e84e22-4b77-453d-874e-1a11f28541ff.png")',
                      backgroundSize: 'cover',
                    }}
                />
                <Box>
                  <Typography variant="body1" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
                    Introducing: New features to help you manage your insurance
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.875rem' }}>
                    April 1, 2022
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8f9fc', p: 2 }}>
                <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 1,
                      bgcolor: 'grey.300',
                      backgroundImage: 'url("https://cdn.usegalileo.ai/sdxl10/303aeb68-0f98-4b42-8790-aa5c181c5172.png")',
                      backgroundSize: 'cover',
                    }}
                />
                <Box>
                  <Typography variant="body1" sx={{ color: '#0d131c', fontWeight: 'medium' }}>
                    We've made it easier to update your payment method
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#49699c', fontSize: '0.875rem' }}>
                    March 15, 2022
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
  );
}

export default UserPage;