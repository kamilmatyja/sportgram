import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { friendService, userService, type FriendResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as InteractionModalModule from '../../components/common/InteractionModal';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserFriends from './UserFriends';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isAdmin: false,
    usersMap: {} as Record<string, UserResource>,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isAdmin: mocks.isAdmin,
        }),
    };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useUsersMap: (userIds: string[]) => ({
            getUser: (id?: string | null) => (id ? mocks.usersMap[id] : undefined),
            isLoading: userIds.some((id) => !mocks.usersMap[id]),
        }),
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components/common/InteractionModal', async (importOriginal) => {
    const actual = await importOriginal<typeof InteractionModalModule>();
    return {
        ...actual,
        InteractionModal: ({
            opened,
            title,
            children,
            onClose,
        }: {
            opened: boolean;
            title: string;
            children: ReactNode;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={title}>
                    {children}
                    <button onClick={onClose}>Zamknij modal</button>
                </section>
            ) : null,
    };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(FriendStatusEnum.ACCEPTED)}>Zmień status znajomości</button>
        ),
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const friend = {
    id: 'friend-1',
    link: 'jan-biegacz',
    firstName: 'Jan',
    lastName: 'Biegacz',
} as UserResource;

const candidate = {
    id: 'candidate-1',
    link: 'ola-runner',
    firstName: 'Ola',
    lastName: 'Runner',
} as UserResource;

const friendshipWithAdmin = {
    id: 'friendship-with-admin',
    senderUserId: profile.id,
    receiverUserId: 'admin-user',
    status: FriendStatusEnum.PENDING,
    createdAt: '2026-11-08T09:00:00',
    updatedAt: '2026-11-08T09:00:00',
} as FriendResource;

const friendships = [
    {
        id: 'friendship-1',
        senderUserId: profile.id,
        receiverUserId: friend.id,
        status: FriendStatusEnum.ACCEPTED,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'friendship-2',
        senderUserId: 'other-user',
        receiverUserId: profile.id,
        status: FriendStatusEnum.PENDING,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as FriendResource[];

function renderFriends() {
    return render(
        <Routes>
            <Route path="/users/:link/friends" element={<UserFriends />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/friends'] },
    );
}

describe('UserFriends', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        mocks.usersMap = {
            [friend.id]: friend,
            'other-user': { id: 'other-user', firstName: 'Piotr', lastName: 'Kolarz', link: 'piotr' } as UserResource,
            [candidate.id]: candidate,
            [profile.id]: profile,
            'admin-user': { id: 'admin-user', firstName: 'Admin', lastName: 'User', link: 'admin' } as UserResource,
        };
        vi.spyOn(userService, 'getUsers').mockImplementation(async (request) => {
            const link = request.params?.query?.filter?.link;
            return { data: link === profile.link ? [profile] : [profile, friend, candidate] } as never;
        });
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({
            data: friendships,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(friendService, 'createFriend').mockResolvedValue({} as never);
        vi.spyOn(friendService, 'updateFriendStatus').mockResolvedValue({} as never);
        vi.spyOn(friendService, 'deleteFriend').mockResolvedValue({} as never);
    });

    it('shows loading before listing the profile’s friends and relationship statuses', async () => {
        let resolveFriends!: (value: { data: FriendResource[]; pagination: { total: number } }) => void;
        vi.mocked(friendService.getFriends).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFriends = resolve;
                }) as never,
        );
        renderFriends();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveFriends).toBeDefined());
        resolveFriends({ data: friendships, pagination: { total: 2 } });

        expect(await screen.findByText('Jan Biegacz')).toBeVisible();
        expect(screen.getByText('Piotr Kolarz')).toBeVisible();
        expect(screen.getByText('Zaakceptowany')).toBeVisible();
        expect(screen.getByText('Oczekujący')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj znajomego' })).toBeVisible();
        expect(friendService.getFriends).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userIds: [profile.id], status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('filters by relationship status, sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: friendships.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderFriends();

        expect(await screen.findByText('Jan Biegacz')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));

        const statusFilter = await screen.findByRole('combobox', { name: 'Status' });
        await user.click(statusFilter);
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(friendService.getFriends).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userIds: [profile.id], status: FriendStatusEnum.ACCEPTED },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(friendService.getFriends).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('lets the profile owner add a friend and sends the selected user id', async () => {
        const user = userEvent.setup();
        vi.mocked(friendService.getFriends).mockImplementation(async (request) => {
            const userIds = request.params?.query?.filter?.userIds;
            return { data: userIds?.length === 1 ? friendships : [] } as never;
        });
        renderFriends();

        expect(await screen.findByText('Jan Biegacz')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj znajomego' }));
        const dialog = screen.getByRole('dialog', { name: 'Dodaj znajomego' });
        const userSelect = await screen.findByRole('combobox', { name: 'Użytkownik' });
        await user.click(userSelect);
        await user.type(userSelect, 'Ola Runner');
        await user.click(await screen.findByText('Ola Runner (@ola-runner)'));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(friendService.createFriend).toHaveBeenCalledWith({ body: { userId: candidate.id } });
        });
        expect(dialog).not.toBeInTheDocument();
    });

    it('lets the owner update a relationship status and delete a friend', async () => {
        const user = userEvent.setup();
        renderFriends();

        expect(await screen.findByText('Jan Biegacz')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Zmień status znajomości' })[0]);
        await waitFor(() => {
            expect(friendService.updateFriendStatus).toHaveBeenCalledWith({
                params: { path: { id: 'friendship-1' } },
                body: { status: FriendStatusEnum.ACCEPTED },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(friendService.deleteFriend).toHaveBeenCalledWith({
                params: { path: { id: 'friendship-1' } },
            });
        });
    });

    it('lets an administrator change only the status of their relationship with the profile owner', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-user', link: 'admin' };
        mocks.isAdmin = true;
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [...friendships, friendshipWithAdmin],
            pagination: { page: 1, total: 3, hasNextPage: false },
        } as never);
        renderFriends();

        expect(await screen.findByText('Admin User')).toBeVisible();
        expect(screen.getAllByRole('button', { name: 'Zmień status znajomości' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: 'Dodaj znajomego' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Zmień status znajomości' }));
        await waitFor(() => {
            expect(friendService.updateFriendStatus).toHaveBeenCalledWith({
                params: { path: { id: friendshipWithAdmin.id } },
                body: { status: FriendStatusEnum.ACCEPTED },
            });
        });
    });

    it('shows an empty state when the profile has no friends', async () => {
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderFriends();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj znajomego' })).toBeVisible();
    });

    it('allows an accepted friend to view the list but hides owner actions', async () => {
        mocks.currentUser = { id: 'viewer-1', link: 'viewer' };
        vi.mocked(friendService.getFriends).mockImplementation(async (request) => {
            const userIds = request.params?.query?.filter?.userIds;
            if (!request.params?.query?.page && userIds?.length === 1 && userIds[0] === profile.id) {
                return {
                    data: [
                        {
                            id: 'access-friendship',
                            senderUserId: profile.id,
                            receiverUserId: 'viewer-1',
                            status: FriendStatusEnum.ACCEPTED,
                        },
                    ],
                } as never;
            }
            return { data: friendships } as never;
        });
        renderFriends();

        expect(await screen.findByText('Jan Biegacz')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj znajomego' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status znajomości' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        vi.mocked(friendService.getFriends).mockResolvedValue({ data: [] } as never);
        renderFriends();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(friendService.getFriends).toHaveBeenCalledTimes(1);
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderFriends();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(friendService.getFriends).not.toHaveBeenCalled();
    });
});
