import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import 'leaflet/dist/leaflet.css';
import './index.css';

import './i18n';
import { theme } from './theme';
import { AuthProvider } from './auth';
import { OfflineProvider } from './services';
import App from './App';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount) => {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    return false;
                }
                return failureCount < 1;
            },
            refetchOnWindowFocus: false,
            networkMode: 'always',
        },
        mutations: {
            networkMode: 'always',
        },
    },
});

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
            console.warn('Service Worker registration failed:', err);
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} defaultColorScheme="dark">
                <Notifications position="top-right" />
                <BrowserRouter>
                    <OfflineProvider>
                        <AuthProvider>
                            <ModalsProvider>
                                <App />
                            </ModalsProvider>
                        </AuthProvider>
                    </OfflineProvider>
                </BrowserRouter>
            </MantineProvider>
        </QueryClientProvider>
    </React.StrictMode>,
);
