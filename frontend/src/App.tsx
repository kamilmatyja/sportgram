import React from 'react';
import {Link, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider, useAuth} from './context/AuthContext';
import {useTheme} from './context/ThemeContext';
import Register from './pages/Register';
import Sign from './pages/Sign';
import PasswordReset from './pages/PasswordReset';
import Users from './pages/Users';
import UserProfile from './pages/UserProfile';
import UserFeeds from './pages/UserFeeds';
import UserStories from './pages/UserStories';
import UserFriends from './pages/UserFriends';
import UserGoals from './pages/UserGoals';
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
import Statistics from './pages/Statistics';
import Home from './pages/Home';

interface RouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<RouteProps> = ({children}) => {
    const {isAuthenticated} = useAuth();
    if (!isAuthenticated) return <Navigate to="/sign" replace/>;
    return <>{children}</>;
};

const GuestRoute: React.FC<RouteProps> = ({children}) => {
    const {isAuthenticated} = useAuth();
    if (isAuthenticated) return <Navigate to="/" replace/>;
    return <>{children}</>;
};

const GuestHome: React.FC = () => {
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
};

const AuthenticatedLayout: React.FC<{children: React.ReactNode}> = ({children}) => {
    const {logout} = useAuth();
    const {theme, toggleTheme} = useTheme();

    return (
        <>
            <nav className="navbar navbar-expand bg-white shadow-sm mb-4 border-bottom">
                <div className="container d-flex justify-content-between">
                    <Link to="/" className="navbar-brand fw-bold text-primary">Sportgram</Link>
                    <div className="d-flex gap-2">
                        <Link to="/users" className="btn btn-sm btn-outline-primary"><i className="bi bi-search"></i></Link>
                        <button className="btn btn-sm btn-outline-secondary" onClick={toggleTheme}>
                            {theme === 'light' ? <i className="bi bi-moon-fill"></i> : <i className="bi bi-sun-fill"></i>}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={logout}><i className="bi bi-box-arrow-right"></i></button>
                    </div>
                </div>
            </nav>
            {children}
        </>
    );
};

const AppRoutes: React.FC = () => {
    const {isAuthLoading, isAuthenticated} = useAuth();

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
            <Route path="/" element={isAuthenticated ? <AuthenticatedLayout><Home/></AuthenticatedLayout> : <GuestHome/>}/>

            <Route path="/register" element={<GuestRoute><Register/></GuestRoute>}/>
            <Route path="/sign" element={<GuestRoute><Sign/></GuestRoute>}/>
            <Route path="/password-reset" element={<GuestRoute><PasswordReset/></GuestRoute>}/>

            <Route path="/users" element={<ProtectedRoute><AuthenticatedLayout><Users/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link" element={<ProtectedRoute><AuthenticatedLayout><UserProfile/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/feeds" element={<ProtectedRoute><AuthenticatedLayout><UserFeeds/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/stories" element={<ProtectedRoute><AuthenticatedLayout><UserStories/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/friends" element={<ProtectedRoute><AuthenticatedLayout><UserFriends/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/goals" element={<ProtectedRoute><AuthenticatedLayout><UserGoals/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/pages" element={<ProtectedRoute><AuthenticatedLayout><UserPages/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/events" element={<ProtectedRoute><AuthenticatedLayout><UserEvents/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/trainings" element={<ProtectedRoute><AuthenticatedLayout><UserTrainings/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/notifications" element={<ProtectedRoute><AuthenticatedLayout><UserNotifications/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/push-subscriptions" element={<ProtectedRoute><AuthenticatedLayout><UserPushSubscriptions/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/users/:link/conversations" element={<ProtectedRoute><AuthenticatedLayout><UserConversations/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/goals/:link" element={<ProtectedRoute><AuthenticatedLayout><GoalDetails/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/trainings/:link" element={<ProtectedRoute><AuthenticatedLayout><TrainingDetails/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/pages" element={<ProtectedRoute><AuthenticatedLayout><PagesList/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/pages/:link" element={<ProtectedRoute><AuthenticatedLayout><PageDetails/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/events" element={<ProtectedRoute><AuthenticatedLayout><EventsList/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/events/:link" element={<ProtectedRoute><AuthenticatedLayout><EventDetails/></AuthenticatedLayout></ProtectedRoute>}/>
            <Route path="/statistics" element={<ProtectedRoute><AuthenticatedLayout><Statistics/></AuthenticatedLayout></ProtectedRoute>}/>

            <Route path="*" element={<h1 className="text-center mt-5">404 - Nie znaleziono</h1>}/>
        </Routes>
    );
};

export default function App() {
    return (
        <AuthProvider>
            <div className="min-vh-100 bg-body text-body">
                <AppRoutes/>
            </div>
        </AuthProvider>
    );
}