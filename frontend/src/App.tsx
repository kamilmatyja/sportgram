import NotFound from './components/NotFound';
import React from 'react';
import { Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { Center, Loader, MantineThemeProvider } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { userService } from './api/services';
import { ColorEnum } from './enums/ColorEnum';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordReset from './pages/auth/PasswordReset';
import UsersList from './pages/users/UsersList';
import UserProfile from './pages/users/UserProfile';
import UserFeeds from './pages/users/UserFeeds';
import UserStories from './pages/users/UserStories';
import UserFriends from './pages/users/UserFriends';
import UserGoals from './pages/goals/UserGoals';
import GoalDetails from './pages/goals/GoalDetails';
import UserPages from './pages/pages/UserPages';
import PageDetails from './pages/pages/PageDetails';
import PagesList from './pages/pages/PagesList';
import UserEvents from './pages/events/UserEvents';
import EventDetails from './pages/events/EventDetails';
import EventsList from './pages/events/EventsList';
import UserTrainings from './pages/trainings/UserTrainings';
import TrainingDetails from './pages/trainings/TrainingDetails';
import UserNotifications from './pages/users/UserNotifications';
import UserPushSubscriptions from './pages/users/UserPushSubscriptions';
import UserConversations from './pages/users/UserConversations';
import Statistics from './pages/statistics/Statistics';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <Center h={300}>
                <Loader size="md" />
            </Center>
        );
    }
    if (!isAuthenticated) {
        return <Navigate to="/sign" replace />;
    }
    return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return (
            <Center h={300}>
                <Loader size="md" />
            </Center>
        );
    }
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
}

function UserProfileThemeLayout() {
    const { link } = useParams<{ link: string }>();
    const { data: user } = useQuery({
        queryKey: ['user', link],
        queryFn: () => (link ? userService.getUserByLink(link) : null),
        enabled: !!link,
    });

    const primaryColor = ColorEnum.getMantineColor(user?.color);

    return (
        <MantineThemeProvider theme={{ primaryColor }} inherit>
            <Outlet />
        </MantineThemeProvider>
    );
}

export default function App() {
    return (
        <AppLayout>
            <Routes>
                <Route path="/" element={<Home />} />

                {/* Guest only routes */}
                <Route
                    path="/sign"
                    element={
                        <GuestRoute>
                            <Login />
                        </GuestRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <GuestRoute>
                            <Register />
                        </GuestRoute>
                    }
                />
                <Route
                    path="/password-reset"
                    element={
                        <GuestRoute>
                            <PasswordReset />
                        </GuestRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/users"
                    element={
                        <ProtectedRoute>
                            <UsersList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link"
                    element={
                        <ProtectedRoute>
                            <UserProfileThemeLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<UserProfile />} />
                    <Route path="feeds" element={<UserFeeds />} />
                    <Route path="stories" element={<UserStories />} />
                    <Route path="friends" element={<UserFriends />} />
                    <Route path="goals" element={<UserGoals />} />
                    <Route path="pages" element={<UserPages />} />
                    <Route path="events" element={<UserEvents />} />
                    <Route path="trainings" element={<UserTrainings />} />
                    <Route path="notifications" element={<UserNotifications />} />
                    <Route path="push-subscriptions" element={<UserPushSubscriptions />} />
                    <Route path="conversations" element={<UserConversations />} />
                </Route>

                <Route
                    path="/goals/:link"
                    element={
                        <ProtectedRoute>
                            <GoalDetails />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/trainings/:link"
                    element={
                        <ProtectedRoute>
                            <TrainingDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/pages"
                    element={
                        <ProtectedRoute>
                            <PagesList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/pages/:link"
                    element={
                        <ProtectedRoute>
                            <PageDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/events"
                    element={
                        <ProtectedRoute>
                            <EventsList />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/events/:link"
                    element={
                        <ProtectedRoute>
                            <EventDetails />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/statistics"
                    element={
                        <ProtectedRoute>
                            <Statistics />
                        </ProtectedRoute>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </AppLayout>
    );
}
