import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { act } from '@testing-library/react';
import { pushSubscriptionService, type PushSubscriptionResource } from '../../api/services';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { PushSubscriptionStatusEnum } from '../../enums/PushSubscriptionStatusEnum';
import UserPushSubscriptions from './UserPushSubscriptions';
import { render, screen, userEvent, waitFor, within } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    isOwner: true,
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        UserSubpageContainer: ({
            ownerOrAdminOnly,
            children,
        }: {
            ownerOrAdminOnly: boolean;
            children: (context: {
                targetUser: { id: string; link: string };
                isOwner: boolean;
                isAdmin: boolean;
            }) => React.ReactNode;
        }) =>
            ownerOrAdminOnly && !mocks.isOwner && !mocks.isAdmin ? (
                <p>Brak dostępu</p>
            ) : (
                children({
                    targetUser: { id: 'user-1', link: 'me' },
                    isOwner: mocks.isOwner,
                    isAdmin: mocks.isAdmin,
                })
            ),
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(PushSubscriptionStatusEnum.REJECTED)}>Zmień status subskrypcji</button>
        ),
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components/common/InteractionModal', () => ({
    InteractionModal: ({ opened, title, children }: { opened: boolean; title: string; children: React.ReactNode }) =>
        opened ? (
            <section role="dialog" aria-label={title}>
                {children}
            </section>
        ) : null,
}));

const subscription = {
    id: 'subscription-1',
    userId: 'user-1',
    endpoint: 'https://push.example/device-1',
    p256dh: 'public-key-1',
    auth: 'auth-key-1',
    userAgent: 'Test Browser 1.0',
    status: PushSubscriptionStatusEnum.ACTIVE,
    createdAt: '2026-11-10T09:00:00',
    updatedAt: '2026-11-10T09:00:00',
} as PushSubscriptionResource;

const initialEntries = ['/users/me/push-subscriptions'];
const serviceWorkerDescriptor = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
const notificationDescriptor = Object.getOwnPropertyDescriptor(window, 'Notification');
const pushManagerDescriptor = Object.getOwnPropertyDescriptor(window, 'PushManager');

function renderSubscriptions() {
    return render(
        <Routes>
            <Route path="/users/:link/push-subscriptions" element={<UserPushSubscriptions />} />
        </Routes>,
        { initialEntries },
    );
}

function setProperty(target: object, key: PropertyKey, value: unknown) {
    Object.defineProperty(target, key, { configurable: true, value, writable: true });
}

function restoreProperty(target: object, key: PropertyKey, descriptor?: PropertyDescriptor) {
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
}

function setupPushBrowser(options?: {
    permission?: NotificationPermission;
    requestPermission?: () => Promise<NotificationPermission>;
    subscribe?: ReturnType<typeof vi.fn>;
    getSubscription?: ReturnType<typeof vi.fn>;
}) {
    const subscriptionResult = {
        endpoint: 'https://push.example/new-device',
        toJSON: () => ({ keys: { p256dh: 'browser-p256dh', auth: 'browser-auth' } }),
    };
    const pushManager = {
        subscribe: options?.subscribe ?? vi.fn().mockResolvedValue(subscriptionResult as unknown as PushSubscription),
        getSubscription: options?.getSubscription ?? vi.fn().mockResolvedValue(null),
    };
    const registration = { pushManager };
    const serviceWorker = {
        register: vi.fn().mockResolvedValue(registration),
        ready: Promise.resolve(registration),
    };
    class MockNotification {
        static permission = options?.permission ?? 'granted';
        static requestPermission = options?.requestPermission ?? vi.fn().mockResolvedValue(MockNotification.permission);
    }

    setProperty(navigator, 'serviceWorker', serviceWorker);
    setProperty(window, 'PushManager', class {});
    setProperty(window, 'Notification', MockNotification);
    return { serviceWorker, pushManager, registration, subscriptionResult, MockNotification };
}

afterEach(() => {
    act(() => notifications.clean());
    restoreProperty(navigator, 'serviceWorker', serviceWorkerDescriptor);
    restoreProperty(window, 'Notification', notificationDescriptor);
    restoreProperty(window, 'PushManager', pushManagerDescriptor);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
});

describe('UserPushSubscriptions', () => {
    beforeEach(() => {
        mocks.isOwner = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(pushSubscriptionService, 'getPushSubscriptions').mockResolvedValue({
            data: [subscription],
            pagination: { page: 1, total: 1, hasNextPage: false },
        } as never);
        vi.spyOn(pushSubscriptionService, 'createPushSubscription').mockResolvedValue({} as never);
        vi.spyOn(pushSubscriptionService, 'updatePushSubscription').mockResolvedValue({} as never);
        vi.spyOn(pushSubscriptionService, 'updatePushSubscriptionStatus').mockResolvedValue({} as never);
        vi.spyOn(pushSubscriptionService, 'deletePushSubscription').mockResolvedValue({} as never);
    });

    it('shows loading and then lists subscription devices and their status', async () => {
        let resolveSubscriptions!: (value: { data: PushSubscriptionResource[]; pagination: { total: number } }) => void;
        vi.mocked(pushSubscriptionService.getPushSubscriptions).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSubscriptions = resolve;
                }) as never,
        );
        renderSubscriptions();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveSubscriptions).toBeDefined());
        resolveSubscriptions({ data: [subscription], pagination: { total: 1 } });

        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();
        expect(screen.getByText('Aktywna')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj subskrypcję' })).toBeVisible();
        expect(pushSubscriptionService.getPushSubscriptions).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        sort: 'createdAt:desc',
                        filter: {
                            userId: 'user-1',
                            endpoint: null,
                            p256dh: null,
                            auth: null,
                        },
                    }),
                }),
            }),
        );
    });

    it('filters by endpoint and keys, sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(pushSubscriptionService.getPushSubscriptions).mockResolvedValue({
            data: [subscription],
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderSubscriptions();

        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        const endpoint = screen.getByLabelText('Adres endpoint');
        const p256dh = screen.getByLabelText('Klucz p256dh');
        const auth = screen.getByLabelText('Klucz auth');
        await waitFor(() => expect(endpoint).toBeVisible());
        await user.type(endpoint, 'https://push.example');
        await user.type(p256dh, 'public-key');
        await user.type(auth, 'auth-key');
        await waitFor(() => {
            expect(pushSubscriptionService.getPushSubscriptions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: {
                                userId: 'user-1',
                                endpoint: 'https://push.example',
                                p256dh: 'public-key',
                                auth: 'auth-key',
                            },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => {
            expect(pushSubscriptionService.getPushSubscriptions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'endpoint:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(pushSubscriptionService.getPushSubscriptions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets the owner manually create and edit subscriptions with the form values', async () => {
        const user = userEvent.setup();
        renderSubscriptions();
        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Dodaj subskrypcję' }));
        let dialog = screen.getByRole('dialog', { name: 'Dodaj subskrypcję' });
        await user.click(within(dialog).getByRole('button', { name: 'Dodaj ręcznie' }));

        const endpoint = within(dialog).getByRole('textbox', { name: 'Adres endpoint' });
        const p256dh = within(dialog).getByRole('textbox', { name: 'Klucz p256dh' });
        const auth = within(dialog).getByRole('textbox', { name: 'Klucz auth' });
        const device = within(dialog).getByRole('textbox', { name: 'Urządzenie' });
        const save = within(dialog).getByRole('button', { name: 'Zapisz' });
        expect(save).toBeDisabled();
        await user.type(endpoint, 'https://push.example/manual');
        await user.type(p256dh, 'manual-public-key');
        await user.type(auth, 'manual-auth-key');
        expect(save).toBeEnabled();
        await user.clear(device);
        expect(save).toBeDisabled();
        await user.type(device, 'Manual Browser');
        expect(save).toBeEnabled();
        await user.click(save);

        await waitFor(() => {
            expect(pushSubscriptionService.createPushSubscription).toHaveBeenCalledWith({
                body: {
                    endpoint: 'https://push.example/manual',
                    p256dh: 'manual-public-key',
                    auth: 'manual-auth-key',
                    userAgent: 'Manual Browser',
                },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        dialog = screen.getByRole('dialog', { name: 'Edytuj subskrypcję' });
        await user.click(within(dialog).getByRole('button', { name: 'Edytuj ręcznie' }));
        expect(within(dialog).getByRole('textbox', { name: 'Adres endpoint' })).toHaveValue(subscription.endpoint);
        const editEndpoint = within(dialog).getByRole('textbox', { name: 'Adres endpoint' });
        await user.clear(editEndpoint);
        await user.type(editEndpoint, 'https://push.example/updated');
        await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(pushSubscriptionService.updatePushSubscription).toHaveBeenCalledWith({
                params: { path: { id: 'subscription-1' } },
                body: {
                    endpoint: 'https://push.example/updated',
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                    userAgent: subscription.userAgent,
                },
            });
        });
    }, 20000);

    it('shows API validation errors when manual creation fails and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(pushSubscriptionService.createPushSubscription).mockRejectedValueOnce({
            errors: [{ field: 'endpoint', message: 'Endpoint został już zarejestrowany' }],
        });
        renderSubscriptions();

        await user.click(await screen.findByRole('button', { name: 'Dodaj subskrypcję' }));
        const dialog = screen.getByRole('dialog', { name: 'Dodaj subskrypcję' });
        await user.click(within(dialog).getByRole('button', { name: 'Dodaj ręcznie' }));
        await user.type(within(dialog).getByRole('textbox', { name: 'Adres endpoint' }), 'https://push.example/new');
        await user.type(within(dialog).getByRole('textbox', { name: 'Klucz p256dh' }), 'public-key');
        await user.type(within(dialog).getByRole('textbox', { name: 'Klucz auth' }), 'auth-key');
        await user.type(within(dialog).getByRole('textbox', { name: 'Urządzenie' }), 'Test Browser');
        await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

        expect(await within(dialog).findByText('Endpoint został już zarejestrowany')).toBeVisible();
        expect(mocks.confirmDelete).not.toHaveBeenCalled();
        expect(screen.getByRole('dialog', { name: 'Dodaj subskrypcję' })).toBeVisible();
    });

    it('shows API validation errors when updating an existing subscription', async () => {
        const user = userEvent.setup();
        vi.mocked(pushSubscriptionService.updatePushSubscription).mockRejectedValueOnce({
            errors: [{ field: 'p256dh', message: 'Nieprawidłowy klucz' }],
        });
        renderSubscriptions();

        await user.click(await screen.findByRole('button', { name: 'Edytuj' }));
        const dialog = screen.getByRole('dialog', { name: 'Edytuj subskrypcję' });
        await user.click(within(dialog).getByRole('button', { name: 'Edytuj ręcznie' }));
        await user.click(within(dialog).getByRole('button', { name: 'Zapisz' }));

        expect(await within(dialog).findByText('Nieprawidłowy klucz')).toBeVisible();
        expect(screen.getByRole('dialog', { name: 'Edytuj subskrypcję' })).toBeVisible();
    });

    it('reports an API error when deleting a subscription', async () => {
        const user = userEvent.setup();
        const showNotification = vi.spyOn(notifications, 'show').mockImplementation(() => '');
        vi.mocked(pushSubscriptionService.deletePushSubscription).mockRejectedValueOnce(
            new Error('Nie udało się usunąć subskrypcji'),
        );
        renderSubscriptions();

        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Usuń' }));

        await waitFor(() => {
            expect(showNotification).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Nie udało się usunąć subskrypcji', color: 'red' }),
            );
        });
    });

    it('lets the owner change status and delete a subscription', async () => {
        const user = userEvent.setup();
        renderSubscriptions();
        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Zmień status subskrypcji' }));
        await waitFor(() => {
            expect(pushSubscriptionService.updatePushSubscriptionStatus).toHaveBeenCalledWith({
                params: { path: { id: 'subscription-1' } },
                body: { status: PushSubscriptionStatusEnum.REJECTED },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(pushSubscriptionService.deletePushSubscription).toHaveBeenCalledWith({
                params: { path: { id: 'subscription-1' } },
            });
        });
    });

    it('reports unsupported browser push capabilities without calling the API', async () => {
        const user = userEvent.setup();
        renderSubscriptions();
        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Dodaj subskrypcję' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj automatycznie' }));

        expect(await screen.findByText(/Brak uprawnień do powiadomień push/)).toBeVisible();
        expect(pushSubscriptionService.createPushSubscription).not.toHaveBeenCalled();
    });

    it('does not subscribe when browser notification permission is denied', async () => {
        const user = userEvent.setup();
        const browser = setupPushBrowser({
            permission: 'default',
            requestPermission: vi.fn().mockResolvedValue('denied'),
        });
        vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'AQIDBA');
        renderSubscriptions();

        await user.click(await screen.findByRole('button', { name: 'Dodaj subskrypcję' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj automatycznie' }));

        expect(await screen.findByText(/Brak uprawnień do powiadomień push/)).toBeVisible();
        expect(browser.serviceWorker.register).not.toHaveBeenCalled();
        expect(browser.pushManager.subscribe).not.toHaveBeenCalled();
        expect(pushSubscriptionService.createPushSubscription).not.toHaveBeenCalled();
    });

    it('registers the service worker and saves the browser push subscription', async () => {
        const user = userEvent.setup();
        const browser = setupPushBrowser({ permission: 'granted' });
        vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'AQIDBA');
        renderSubscriptions();

        await user.click(await screen.findByRole('button', { name: 'Dodaj subskrypcję' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj automatycznie' }));

        await waitFor(() => {
            expect(browser.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
            expect(browser.pushManager.subscribe).toHaveBeenCalledWith({
                userVisibleOnly: true,
                applicationServerKey: new Uint8Array([1, 2, 3, 4]),
            });
            expect(pushSubscriptionService.createPushSubscription).toHaveBeenCalledWith({
                body: {
                    endpoint: 'https://push.example/new-device',
                    p256dh: 'browser-p256dh',
                    auth: 'browser-auth',
                    userAgent: navigator.userAgent,
                },
            });
        });
    });

    it('saves an existing browser push subscription without creating a duplicate', async () => {
        const user = userEvent.setup();
        const existingSubscription = {
            endpoint: 'https://push.example/existing-device',
            toJSON: () => ({ keys: { p256dh: 'existing-p256dh', auth: 'existing-auth' } }),
        };
        const getSubscription = vi.fn().mockResolvedValue(existingSubscription as unknown as PushSubscription);
        const subscribe = vi.fn();
        const browser = setupPushBrowser({ permission: 'granted', getSubscription, subscribe });
        vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'AQIDBA');
        renderSubscriptions();

        await user.click(await screen.findByRole('button', { name: 'Dodaj subskrypcję' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj automatycznie' }));

        await waitFor(() => {
            expect(getSubscription).toHaveBeenCalledOnce();
            expect(subscribe).not.toHaveBeenCalled();
            expect(pushSubscriptionService.createPushSubscription).toHaveBeenCalledWith({
                body: {
                    endpoint: 'https://push.example/existing-device',
                    p256dh: 'existing-p256dh',
                    auth: 'existing-auth',
                    userAgent: navigator.userAgent,
                },
            });
        });
        expect(browser.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('allows administrators to manage status but hides owner-only create and delete actions', async () => {
        const user = userEvent.setup();
        mocks.isOwner = false;
        mocks.isAdmin = true;
        renderSubscriptions();

        expect(await screen.findByText('Test Browser 1.0...')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj subskrypcję' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zmień status subskrypcji' }));
        await waitFor(() => {
            expect(pushSubscriptionService.updatePushSubscriptionStatus).toHaveBeenCalled();
        });
    });

    it('shows the empty state and protects subscriptions from another user', async () => {
        vi.mocked(pushSubscriptionService.getPushSubscriptions).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderSubscriptions();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();

        mocks.isOwner = false;
        mocks.isAdmin = false;
        renderSubscriptions();
        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(pushSubscriptionService.getPushSubscriptions).toHaveBeenCalledOnce();
    });
});
