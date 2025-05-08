import React from 'react';
import { Box } from '@mui/material';
import MenuBar from './MenuBar';

interface AppLayoutProps {
    children: React.ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
    return (
        <Box sx={{ display: 'flex' }}>
            <MenuBar />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    ml: { sm: `${240}px` },
                    mt: { xs: 8, sm: 0 },
                    width: { xs: '100%', sm: `calc(100% - ${240}px)` },
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default AppLayout;