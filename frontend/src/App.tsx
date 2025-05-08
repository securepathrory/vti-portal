import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import UserPage from './pages/UserPage';
import AppLayout from './components/AppLayout';

function App() {
    const token = localStorage.getItem('token');

    return (
        <Routes>
            {/* Render LoginPage at the root path */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
                path="/admin"
                element={token ? <AppLayout><AdminPage /></AppLayout> : <Navigate to="/" />}
            />
            <Route
                path="/user"
                element={token ? <AppLayout><UserPage /></AppLayout> : <Navigate to="/" />}
            />

            {/* Optional catch-all route for 404 */}
            <Route path="*" element={<div>404 - Not Found</div>} />
        </Routes>
    );
}

export default App;