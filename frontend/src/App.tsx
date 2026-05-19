import React from 'react';
import { Navigate, Route, Routes, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Register from './pages/Register';
import Sign from './pages/Sign';
import PasswordReset from './pages/PasswordReset';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import UserSettings from './pages/UserSettings';
import UserFeeds from './pages/UserFeeds';
import UserStories from './pages/UserStories';
import UserFriends from './pages/UserFriends';
import UserGoals from './pages/UserGoals.tsx';
import UserPages from './pages/UserPages';
import UserEvents from './pages/UserEvents';
import UserTrainings from './pages/UserTrainings';
import UserNotifications from './pages/UserNotifications';
import UserPushSubscriptions from './pages/UserPushSubscriptions';
import UserConversations from './pages/UserConversations';
import GoalDetails from './pages/GoalDetails';
import TrainingDetails from './pages/TrainingDetails';
import PagesList from './pages/PagesList';
import PageDetails from './pages/PageDetails';
import EventsList from './pages/EventsList';
import EventDetails from './pages/EventDetails';
import EventLists from './pages/EventLists';
import EventResults from './pages/EventResults';
import Statistics from './pages/Statistics';

interface RouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/sign" replace />;
    return <>{children}</>;
};

const GuestRoute: React.FC<RouteProps> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <Navigate to="/" replace />;
    return <>{children}</>;
};

const Home: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    if (!isAuthenticated) {
        return (
            <div className="container mt-5 text-center">
                <h1>Witaj w Sportgram!</h1>
                <p className="text-muted">Zaloguj się lub utwórz konto, aby kontynuować.</p>
                <div className="mt-4 gap-3 d-flex justify-content-center">
                    <Link to="/sign" className="btn btn-primary">Logowanie</Link>
                    <Link to="/register" className="btn btn-outline-primary">Rejestracja</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 text-center">
            <h1>Strona główna</h1>
            <div className="row mt-4">
                <div className="col-md-6 border-end">
                    <h3>Stories</h3>
                    <p className="text-muted small">Tutaj pojawi się komponent wyświetlający stories...</p>
                </div>
                <div className="col-md-6">
                    <h3>Feeds</h3>
                    <p className="text-muted small">Tutaj pojawi się komponent wyświetlający listę wpisów...</p>
                </div>
            </div>
            <div className="mt-5 border-top pt-4">
                <button className="btn btn-danger me-2" onClick={logout}>Wyloguj</button>
                <button className="btn btn-secondary" onClick={toggleTheme}>
                    Motyw: {theme === 'light' ? 'Jasny ☀️' : 'Ciemny 🌙'}
                </button>
            </div>
        </div>
    );
};

const AppRoutes: React.FC = () => {
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
            <Route path="/" element={<Home />} />

            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
            <Route path="/sign" element={<GuestRoute><Sign /></GuestRoute>} />
            <Route path="/password-reset" element={<GuestRoute><PasswordReset /></GuestRoute>} />

            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/users/:link" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/users/:link/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/users/:link/feeds" element={<ProtectedRoute><UserFeeds /></ProtectedRoute>} />
            <Route path="/users/:link/stories" element={<ProtectedRoute><UserStories /></ProtectedRoute>} />
            <Route path="/users/:link/friends" element={<ProtectedRoute><UserFriends /></ProtectedRoute>} />
            <Route path="/users/:link/goals" element={<ProtectedRoute><UserGoals /></ProtectedRoute>} />
            <Route path="/users/:link/pages" element={<ProtectedRoute><UserPages /></ProtectedRoute>} />
            <Route path="/users/:link/events" element={<ProtectedRoute><UserEvents /></ProtectedRoute>} />
            <Route path="/users/:link/trainings" element={<ProtectedRoute><UserTrainings /></ProtectedRoute>} />
            <Route path="/users/:link/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
            <Route path="/users/:link/push-subscriptions" element={<ProtectedRoute><UserPushSubscriptions /></ProtectedRoute>} />
            <Route path="/users/:link/conversations" element={<ProtectedRoute><UserConversations /></ProtectedRoute>} />
            <Route path="/goals/:link" element={<ProtectedRoute><GoalDetails /></ProtectedRoute>} />
            <Route path="/trainings/:link" element={<ProtectedRoute><TrainingDetails /></ProtectedRoute>} />
            <Route path="/pages" element={<ProtectedRoute><PagesList /></ProtectedRoute>} />
            <Route path="/pages/:link" element={<ProtectedRoute><PageDetails /></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><EventsList /></ProtectedRoute>} />
            <Route path="/events/:link" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
            <Route path="/events/:link/:discipline/:distance/lists" element={<ProtectedRoute><EventLists /></ProtectedRoute>} />
            <Route path="/events/:link/:discipline/:distance/results" element={<ProtectedRoute><EventResults /></ProtectedRoute>} />
            <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />

            <Route path="*" element={<h1 className="text-center mt-5">404 - Nie znaleziono</h1>} />
        </Routes>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <div className="min-vh-100 bg-body text-body">
                <AppRoutes />
            </div>
        </AuthProvider>
    );
}