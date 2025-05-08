import { Box, Typography } from '@mui/material';

function SettingsPage() {
    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#005670' }}>
                Settings
            </Typography>
            <Typography>Placeholder for user settings.</Typography>
        </Box>
    );
}

export default SettingsPage;