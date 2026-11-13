import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { notificationService, type NotificationResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { NotificationStatusEnum } from '../../enums/NotificationStatusEnum';
import UserNotifications from './UserNotifications';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: { id: 'user-1', link: 'ada' },
    isOwner: true,
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser, isAdmin: mocks.isAdmin }) };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

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
                    targetUser: { id: 'user-1', link: 'ada' },
                    isOwner: mocks.isOwner,
                    isAdmin: mocks.isAdmin,
                })
            ),
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(NotificationStatusEnum.READ)}>Oznacz jako przeczytane</button>
        ),
    };
});

const notifications = [
    {
        id: 'notification-1',
        userId: 'user-1',
        text: 'Otrzymałeś nową wiadomość',
        link: '/users/jan/conversations',
        status: NotificationStatusEnum.SENT,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'notification-2',
        userId: 'user-1',
        text: 'Zaproszenie do znajomych',
        link: '',
        status: NotificationStatusEnum.READ,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as NotificationResource[];

function renderNotifications(link = 'ada') {
    return render(
        <Routes>
            <Route path="/users/:link/notifications" element={<UserNotifications />} />
        </Routes>,
        { initialEntries: [`/users/${link}/notifications`] },
    );
}

describe('UserNotifications', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'user-1', link: 'ada' };
        mocks.isOwner = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(notificationService, 'getNotifications').mockResolvedValue({
            data: notifications,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(notificationService, 'updateNotificationStatus').mockResolvedValue({} as never);
        vi.spyOn(notificationService, 'deleteNotification').mockResolvedValue({} as never);
    });

    it('shows loading and then displays notification text, status and links', async () => {
        let resolveNotifications!: (value: { data: NotificationResource[]; pagination: { total: number } }) => void;
        vi.mocked(notificationService.getNotifications).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveNotifications = resolve;
                }) as never,
        );
        renderNotifications();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveNotifications).toBeDefined());
        resolveNotifications({ data: notifications, pagination: { total: 2 } });

        expect(await screen.findByText('Otrzymałeś nową wiadomość')).toBeVisible();
        expect(screen.getByText('Zaproszenie do znajomych')).toBeVisible();
        expect(screen.getByText('Wysłano')).toBeVisible();
        expect(screen.getByText('Przeczytano')).toBeVisible();
        expect(screen.getByRole('link', { name: 'Szczegóły' })).toHaveAttribute('href', '/users/jan/conversations');
        expect(notificationService.getNotifications).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: 'user-1', text: null, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('filters notifications by text and status, sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(notificationService.getNotifications).mockResolvedValue({
            data: notifications,
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderNotifications();

        expect(await screen.findByText('Otrzymałeś nową wiadomość')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Treść'), ' wiadomość ');
        await user.click(await screen.findByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(notificationService.getNotifications).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: {
                                userId: 'user-1',
                                text: 'wiadomość',
                                status: NotificationStatusEnum.SENT,
                            },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => {
            expect(notificationService.getNotifications).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'text:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(notificationService.getNotifications).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets the owner update notification status and delete notifications', async () => {
        const user = userEvent.setup();
        renderNotifications();
        expect(await screen.findByText('Otrzymałeś nową wiadomość')).toBeVisible();

        await user.click(screen.getAllByRole('button', { name: 'Oznacz jako przeczytane' })[0]);
        await waitFor(() => {
            expect(notificationService.updateNotificationStatus).toHaveBeenCalledWith({
                params: { path: { id: 'notification-1' } },
                body: { status: NotificationStatusEnum.READ },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(notificationService.deleteNotification).toHaveBeenCalledWith({
                params: { path: { id: 'notification-1' } },
            });
        });
    });

    it('does not let an administrator delete notifications', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isOwner = false;
        mocks.isAdmin = true;
        renderNotifications();

        expect(await screen.findByText('Otrzymałeś nową wiadomość')).toBeVisible();
        expect(notificationService.getNotifications).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        filter: { userId: 'user-1', text: null, status: null },
                    }),
                }),
            }),
        );
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        await user.click(screen.getAllByRole('button', { name: 'Oznacz jako przeczytane' })[0]);
        await waitFor(() => {
            expect(notificationService.updateNotificationStatus).toHaveBeenCalledWith({
                params: { path: { id: 'notification-1' } },
                body: { status: NotificationStatusEnum.READ },
            });
        });
    });

    it('shows an empty state when there are no notifications', async () => {
        vi.mocked(notificationService.getNotifications).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderNotifications();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('does not request notifications for a non-owner who is not an administrator', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend' };
        mocks.isOwner = false;
        renderNotifications();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(notificationService.getNotifications).not.toHaveBeenCalled();
    });
});
