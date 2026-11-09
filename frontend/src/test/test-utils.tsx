import { type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme } from '../theme';
import '../i18n';

export function createTestQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
}

interface WrapperProps {
    children: ReactNode;
    initialEntries?: string[];
    queryClient?: QueryClient;
}

export function AllProviders({
    children,
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
}: WrapperProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme}>
                <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
            </MantineProvider>
        </QueryClientProvider>
    );
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
