import { brown } from './theme';
import NotFound from './components/NotFound';
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, Outlet, useLocation } from 'react-router-dom';
import { Center, Loader, MantineThemeProvider } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/AppLayout';
import { userService } from './api/services';
import { ColorEnum } from './enums/ColorEnum';
import { applyThemeColor } from './utils/themeUtils';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PasswordReset from './pages/auth/PasswordReset';
import UsersList from './pages/users/UsersList';
import UserProfile from './pages/users/UserProfile';
import UserFeeds from './pages/users/UserFeeds';
import UserFeedReactions from './pages/users/UserFeedReactions';
import UserFeedComments from './pages/users/UserFeedComments';
import UserStories from './pages/users/UserStories';
import UserFriends from './pages/users/UserFriends';
import UserGoals from './pages/goals/UserGoals';
import GoalDetails from './pages/goals/GoalDetails';
import UserPages from './pages/pages/UserPages';
import UserPageFollows from './pages/users/UserPageFollows';
import PageDetails from './pages/pages/PageDetails';
import PagesList from './pages/pages/PagesList';
import UserEvents from './pages/events/UserEvents';
import UserEventSignups from './pages/users/UserEventSignups';
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

function ProtectedLayout() {
    return (
        <ProtectedRoute>
            <Outlet />
        </ProtectedRoute>
    );
}

function UserProfileThemeLayout() {
    const { link } = useParams<{ link: string }>();
    const { data: user } = useQuery({
        queryKey: ['user', link],
        queryFn: async () => {
            if (!link) return null;
            const res = await userService.getUsers({
                params: {
                    query: {
                        filter: { link, userIds: null },
                        'include[]': ['userDisciplines', 'userRoles'],
                        limit: 1,
                    },
                },
            });
            return res.data?.[0] ?? null;
        },
    });

    const primaryColor = ColorEnum.getMantineColor(user?.color);

    useEffect(() => {
        applyThemeColor(primaryColor);
        return () => {
            applyThemeColor('blue');
        };
    }, [primaryColor]);

    return (
        <MantineThemeProvider theme={{ primaryColor, colors: { brown } }} inherit>
            <Outlet />
        </MantineThemeProvider>
    );
}

export default function App() {
    const location = useLocation();

    useEffect(() => {
        if (
            location.pathname === '/' ||
            location.pathname === '/users' ||
            location.pathname === '/pages' ||
            location.pathname === '/events' ||
            location.pathname === '/statistics'
        ) {
            applyThemeColor('blue');
        }
    }, [location.pathname]);

    return (
        <AppLayout>
            <Routes>
                <Route path="/" element={<Home />} />

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

                <Route element={<ProtectedLayout />}>
                    <Route path="/users" element={<UsersList />} />
                    <Route path="/users/:link" element={<UserProfileThemeLayout />}>
                        <Route index element={<UserProfile />} />
                        <Route path="stories" element={<UserStories />} />
                        <Route path="feeds" element={<UserFeeds />} />
                        <Route path="feed-reactions" element={<UserFeedReactions />} />
                        <Route path="feed-comments" element={<UserFeedComments />} />
                        <Route path="friends" element={<UserFriends />} />
                        <Route path="pages" element={<UserPages />} />
                        <Route path="page-follows" element={<UserPageFollows />} />
                        <Route path="events" element={<UserEvents />} />
                        <Route path="event-signups" element={<UserEventSignups />} />
                        <Route path="trainings" element={<UserTrainings />} />
                        <Route path="goals" element={<UserGoals />} />
                        <Route path="conversations" element={<UserConversations />} />
                        <Route path="notifications" element={<UserNotifications />} />
                        <Route path="push-subscriptions" element={<UserPushSubscriptions />} />
                    </Route>

                    <Route path="/goals/:link" element={<GoalDetails />} />
                    <Route path="/trainings/:link" element={<TrainingDetails />} />

                    <Route path="/pages" element={<PagesList />} />
                    <Route path="/pages/:link" element={<PageDetails />} />

                    <Route path="/events" element={<EventsList />} />
                    <Route path="/events/:link" element={<EventDetails />} />

                    <Route path="/statistics" element={<Statistics />} />
                </Route>

                <Route path="*" element={<NotFound />} />
            </Routes>
        </AppLayout>
    );
}
