import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Register from './pages/Register';
import Sign from './pages/Sign';
import PasswordReset from './pages/PasswordReset';
import { useTheme } from './context/ThemeContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/sign" replace />;
    return children;
};

const GuestRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
};

const MainPlaceholder = () => {
    const { logout, token, signId } = useAuth();
    const { theme, toggleTheme } = useTheme();
    return (
        <div className="container mt-5 text-center">
            <h1>Strona główna</h1>
            <p className="small text-muted">Mój Sign ID: {signId}</p>
            <p className="small text-muted text-break">Mój Token: {token}</p>
            <button className="btn btn-danger mt-4" onClick={logout}>Wyloguj mnie całkowicie</button>

            <button className="btn btn-outline-secondary" onClick={toggleTheme}>
                {theme === 'light' ? '🌙' : '☀️'}
            </button>
        </div>
    );
};

const AppRoutes = () => {
    const { isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return (
            <div className="min-vh-100 d-flex justify-content-center align-items-center bg-light">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Sprawdzanie sesji...</span>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<MainPlaceholder />} />

            <Route path="/register" element={
                <GuestRoute>
                    <Register />
                </GuestRoute>
            } />
            <Route path="/sign" element={
                <GuestRoute>
                    <Sign />
                </GuestRoute>
            } />
            <Route path="/password-reset" element={
                <GuestRoute>
                    <PasswordReset />
                </GuestRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute>
                    {/*<Users />*/}
                </ProtectedRoute>
            } />

            <Route path="*" element={<h1 className="text-center mt-5">404 - Nie znaleziono</h1>} />
        </Routes>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <div className="min-vh-100 bg-light">
                <AppRoutes />
            </div>
        </AuthProvider>
    );
}