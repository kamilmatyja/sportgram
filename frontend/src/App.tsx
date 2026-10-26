import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';

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

export default function App() {
    const { t } = useTranslation();
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
                            <UserProfile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/feeds"
                    element={
                        <ProtectedRoute>
                            <UserFeeds />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/stories"
                    element={
                        <ProtectedRoute>
                            <UserStories />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/friends"
                    element={
                        <ProtectedRoute>
                            <UserFriends />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/goals"
                    element={
                        <ProtectedRoute>
                            <UserGoals />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/pages"
                    element={
                        <ProtectedRoute>
                            <UserPages />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/events"
                    element={
                        <ProtectedRoute>
                            <UserEvents />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/trainings"
                    element={
                        <ProtectedRoute>
                            <UserTrainings />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/notifications"
                    element={
                        <ProtectedRoute>
                            <UserNotifications />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/push-subscriptions"
                    element={
                        <ProtectedRoute>
                            <UserPushSubscriptions />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/users/:link/conversations"
                    element={
                        <ProtectedRoute>
                            <UserConversations />
                        </ProtectedRoute>
                    }
                />

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
                <Route
                    path="*"
                    element={
                        <Center py={60}>
                            <Stack align="center">
                                <Text size="32px" fw={700}>
                                    404
                                </Text>
                                <Text c="dimmed">{t('notFound.message')}</Text>
                            </Stack>
                        </Center>
                    }
                />
            </Routes>
        </AppLayout>
    );
}
