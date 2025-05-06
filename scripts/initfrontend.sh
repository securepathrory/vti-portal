#!/bin/bash

# init-frontend.sh
# Initializes the frontend/ folder for the web-portal project with React/MUI
# Aligns color theme with https://vtinsuranceagency.com/
# Includes index.html to fix Vite build error
# Clears node_modules and package-lock.json to avoid npm optional dependency issues
# Creates directory structure and files for the frontend only

set -e

# Project root directory
PROJECT_DIR="../"
# Frontend directory
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Function to prompt for input with a default value
prompt_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    read -p "$prompt [$default]: " input
    eval "$var_name='${input:-$default}'"
}

# Function to create a file with content, prompting to overwrite if it exists
create_file() {
    local file_path="$1"
    local content="$2"
    local dir_path=$(dirname "$file_path")

    # Create directory if it doesn't exist
    mkdir -p "$dir_path"

    # Check if file exists
    if [ -f "$file_path" ]; then
        read -p "File $file_path already exists. Overwrite? (y/N): " overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            echo "Skipping $file_path"
            return
        fi
    fi

    # Write content to file
    echo "$content" > "$file_path"
    echo "Created $file_path"
}

# Clear existing node_modules and package-lock.json to avoid npm issues
echo "Clearing existing node_modules and package-lock.json..."
rm -rf "$FRONTEND_DIR/node_modules" "$FRONTEND_DIR/package-lock.json"

# Create frontend directory structure
echo "Creating frontend directory structure..."
mkdir -p "$FRONTEND_DIR/src/components" \
        "$FRONTEND_DIR/src/pages" \
        "$FRONTEND_DIR/src/api" \
        "$FRONTEND_DIR/public"

# Create frontend index.html
FRONTEND_INDEX_HTML=$(cat << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VTI Portal</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
EOF
)
create_file "$FRONTEND_DIR/index.html" "$FRONTEND_INDEX_HTML"

# Create frontend package.json
FRONTEND_PACKAGE_JSON=$(cat << 'EOF'
{
  "name": "web-portal-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx",
    "preview": "vite preview"
  },
  "dependencies": {
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@mui/icons-material": "^5.15.20",
    "@mui/material": "^5.15.20",
    "@tanstack/react-query": "^5.45.0",
    "axios": "^1.7.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.23.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.13.1",
    "@typescript-eslint/parser": "^7.13.1",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}
EOF
)
create_file "$FRONTEND_DIR/package.json" "$FRONTEND_PACKAGE_JSON"

# Create frontend vite.config.ts
FRONTEND_VITE_CONFIG=$(cat << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
EOF
)
create_file "$FRONTEND_DIR/vite.config.ts" "$FRONTEND_VITE_CONFIG"

# Create frontend tsconfig.json
FRONTEND_TSCONFIG=$(cat << 'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": false,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
)
create_file "$FRONTEND_DIR/tsconfig.json" "$FRONTEND_TSCONFIG"

# Create frontend tsconfig.node.json
FRONTEND_TSCONFIG_NODE=$(cat << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF
)
create_file "$FRONTEND_DIR/tsconfig.node.json" "$FRONTEND_TSCONFIG_NODE"

# Create frontend src/main.tsx
FRONTEND_MAIN_TSX=$(cat << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import theme from './theme';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <App />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
EOF
)
create_file "$FRONTEND_DIR/src/main.tsx" "$FRONTEND_MAIN_TSX"

# Create frontend src/App.tsx
FRONTEND_APP_TSX=$(cat << 'EOF'
import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/user" element={<UserPage />} />
    </Routes>
  );
}

export default App;
EOF
)
create_file "$FRONTEND_DIR/src/App.tsx" "$FRONTEND_APP_TSX"

# Create frontend src/theme.ts
FRONTEND_THEME_TS=$(cat << 'EOF'
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#005670', // Deep blue from vtinsuranceagency.com
    },
    secondary: {
      main: '#F58220', // Vibrant orange from vtinsuranceagency.com
    },
    background: {
      default: '#FFFFFF', // White background
    },
    text: {
      primary: '#1A2526', // Dark gray/black for headings
      secondary: '#6D8299', // Medium gray for secondary text
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F57C00',
    },
    info: {
      main: '#0288D1',
    },
    success: {
      main: '#2E7D32',
    },
  },
});

export default theme;
EOF
)
create_file "$FRONTEND_DIR/src/theme.ts" "$FRONTEND_THEME_TS"

# Create frontend src/api/auth.ts
FRONTEND_AUTH_TS=$(cat << 'EOF'
import axios from 'axios';

const API_URL = '/api'; // Relative path since backend serves frontend

export const login = async (username: string, password: string) => {
  const response = await axios.post(`${API_URL}/login`, { username, password });
  return response.data.token;
};

export const getAdminData = async (token: string) => {
  const response = await axios.get(`${API_URL}/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getUserData = async (token: string) => {
  const response = await axios.get(`${API_URL}/user`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
EOF
)
create_file "$FRONTEND_DIR/src/api/auth.ts" "$FRONTEND_AUTH_TS"

# Create frontend src/pages/LoginPage.tsx
FRONTEND_LOGIN_PAGE=$(cat << 'EOF'
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { login } from '../api/auth';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await login(username, password);
      localStorage.setItem('token', token);
      navigate('/admin'); // Or redirect based on role
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Login
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit}>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
          Login
        </Button>
      </form>
    </Box>
  );
}

export default LoginPage;
EOF
)
create_file "$FRONTEND_DIR/src/pages/LoginPage.tsx" "$FRONTEND_LOGIN_PAGE"

# Create frontend src/pages/AdminPage.tsx
FRONTEND_ADMIN_PAGE=$(cat << 'EOF'
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
EOF
)
create_file "$FRONTEND_DIR/src/pages/AdminPage.tsx" "$FRONTEND_ADMIN_PAGE"

# Create frontend src/pages/UserPage.tsx
FRONTEND_USER_PAGE=$(cat << 'EOF'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getUserData } from '../api/auth';

function UserPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const token = localStorage.getItem('token') || '';

  const { data, error: queryError } = useQuery({
    queryKey: ['userData'],
    queryFn: () => getUserData(token),
    enabled: !!token,
  });

  useEffect(() => {
    if (!token) {
      navigate('/');
    }
    if (queryError) {
      setError(queryError.message || 'Failed to fetch user data');
    }
  }, [token, queryError, navigate]);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 8, p: 2 }}>
      <Typography variant="h4" gutterBottom>
        User Dashboard
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {data && <Typography>{data.message}</Typography>}
    </Box>
  );
}

export default UserPage;
EOF
)
create_file "$FRONTEND_DIR/src/pages/UserPage.tsx" "$FRONTEND_USER_PAGE"

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm install --silent
cd ../..

# Final instructions
echo "Frontend initialization complete!"
echo "Next steps:"
echo "1. Ensure the backend (main.go) is configured to serve frontend/dist/ (FRONTEND_DIR in .env)."
echo "2. Navigate to $FRONTEND_DIR: cd $FRONTEND_DIR"
echo "3. Run the frontend in development mode: npm run dev"
echo "4. Build the frontend for production: npm run build"
echo "5. Access the frontend at http://localhost:3000 (dev) or via the backend (e.g., http://localhost:8080 after building)."
echo "6. Push changes to the dev branch: git push origin dev"
echo "7. The color theme in src/theme.ts is aligned with https://vtinsuranceagency.com/."