import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Box, useMediaQuery, useTheme } from '@mui/material';
import { Home, Add, List as ListIcon, Settings, Menu as MenuIcon } from '@mui/icons-material';
import { jwtDecode } from 'jwt-decode';

const drawerWidth = 240;

interface Claims {
    roles: string[];
}

function MenuBar() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const token = localStorage.getItem('token');
    const roles = token ? (jwtDecode<Claims>(token).roles || []) : [];

    const hasUserRole = roles.includes('end_user_read_only') || roles.includes('end_user_manager');

    const menuItems = hasUserRole ? [
        { text: 'Home', icon: <Home />, path: '/user' },
        { text: 'Create Quote', icon: <Add />, path: '/user/create-quote' },
        { text: 'Check Quotes', icon: <ListIcon />, path: '/user/check-quotes' },
        { text: 'Settings', icon: <Settings />, path: '/user/settings' },
    ] : [];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const drawerContent = (
        <Box sx={{ bgcolor: '#005670', height: '100%', color: '#fff' }}>
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        button
                        key={item.text}
                        onClick={() => {
                            navigate(item.path);
                            if (isMobile) setMobileOpen(false);
                        }}
                        sx={{
                            '&:hover': { bgcolor: '#F58220' },
                            '&.Mui-selected': { bgcolor: '#F58220' },
                        }}
                    >
                        <ListItemIcon sx={{ color: '#fff' }}>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1300, color: '#005670' }}
                >
                    <MenuIcon />
                </IconButton>
            )}
            <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                open={isMobile ? mobileOpen : true}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better mobile performance
                sx={{
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        bgcolor: '#005670',
                    },
                }}
            >
                {drawerContent}
            </Drawer>
        </>
    );
}

export default MenuBar;