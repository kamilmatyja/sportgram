import { type ReactElement, type ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender, type RenderOptions } from '@testing-library/react';
import { theme } from '../theme';
import { AuthProvider } from '../auth';
import { OfflineProvider } from '../services';
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
                <Notifications />
                <MemoryRouter initialEntries={initialEntries}>
                    <OfflineProvider>
                        <AuthProvider>
                            <ModalsProvider>{children}</ModalsProvider>
                        </AuthProvider>
                    </OfflineProvider>
                </MemoryRouter>
            </MantineProvider>
        </QueryClientProvider>
    );
}

interface ProviderRenderOptions extends Omit<RenderOptions, 'wrapper'> {
    initialEntries?: string[];
    queryClient?: QueryClient;
}

export function render(ui: ReactElement, { initialEntries, queryClient, ...options }: ProviderRenderOptions = {}) {
    return rtlRender(ui, {
        wrapper: ({ children }) => (
            <AllProviders initialEntries={initialEntries} queryClient={queryClient}>
                {children}
            </AllProviders>
        ),
        ...options,
    });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
