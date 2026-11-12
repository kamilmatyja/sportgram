import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes, useLocation } from 'react-router-dom';
import { feedService, friendService, storyService, userService, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserProfile from './UserProfile';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isAdmin: false,
    logout: vi.fn(),
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isAdmin: mocks.isAdmin,
            logout: mocks.logout,
        }),
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        HeaderBannerWithAvatar: ({ children }: { children: ReactNode }) => <section>{children}</section>,
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(3)}>Zmień status profilu</button>
        ),
        EditActionButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Edytuj profil</button>,
        DeleteActionButton: ({ onClick }: { onClick: () => void }) => <button onClick={onClick}>Usuń profil</button>,
        UserFormModal: ({ opened, onClose }: { opened: boolean; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label="Edycja profilu">
                    <button onClick={onClose}>Zamknij edycję</button>
                </section>
            ) : null,
        StoriesBar: ({
            onAddStory,
            onAddFeed,
            onSelectGroup,
        }: {
            onAddStory?: () => void;
            onAddFeed?: () => void;
            onSelectGroup: () => void;
        }) => (
            <section aria-label="Relacje profilu">
                <button onClick={onSelectGroup}>Otwórz relacje</button>
                {onAddStory && <button onClick={onAddStory}>Dodaj relację</button>}
                {onAddFeed && <button onClick={onAddFeed}>Dodaj wpis</button>}
            </section>
        ),
        EmptyState: ({ title }: { title: string }) => <p>{title}</p>,
        FeedCard: () => <article>Wpis użytkownika</article>,
        FeedModal: ({ opened, onClose }: { opened: boolean; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label="Nowy wpis">
                    <button onClick={onClose}>Zamknij wpis</button>
                </section>
            ) : null,
        StoryModal: ({ opened, onClose }: { opened: boolean; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label="Nowa relacja">
                    <button onClick={onClose}>Zamknij relację</button>
                </section>
            ) : null,
        StoryViewerModal: ({ opened, onClose }: { opened: boolean; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label="Podgląd relacji">
                    <button onClick={onClose}>Zamknij podgląd</button>
                </section>
            ) : null,
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    bio: 'Biegam długie dystanse.',
    status: 1,
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
    disciplines: [{ id: 'discipline-1', discipline: 1 }],
} as UserResource;

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

function renderProfile() {
    return render(
        <>
            <Routes>
                <Route path="/users/:link" element={<UserProfile />} />
                <Route path="/sign" element={<p>Logowanie</p>} />
            </Routes>
            <LocationPath />
        </>,
        { initialEntries: ['/users/ada-runner'] },
    );
}

describe('UserProfile', () => {
    beforeEach(() => {
        mocks.currentUser = null;
        mocks.isAdmin = false;
        mocks.logout.mockReset();
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(userService, 'updateUserStatus').mockResolvedValue({} as never);
        vi.spyOn(userService, 'deleteUser').mockResolvedValue({} as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(friendService, 'createFriend').mockResolvedValue({} as never);
        vi.spyOn(friendService, 'updateFriendStatus').mockResolvedValue({} as never);
        vi.spyOn(friendService, 'deleteFriend').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'getFeeds').mockResolvedValue({
            data: [],
            pagination: { page: 1, hasNextPage: false },
        } as never);
        vi.spyOn(storyService, 'getStories').mockResolvedValue({
            data: [],
            pagination: { page: 1, hasNextPage: false },
        } as never);
    });

    it('shows loading before rendering profile details and public navigation', async () => {
        let resolveUsers!: (value: { data: UserResource[] }) => void;
        vi.mocked(userService.getUsers).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveUsers = resolve;
                }) as never,
        );
        renderProfile();

        expect(screen.getByRole('status')).toBeInTheDocument();
        await waitFor(() => expect(resolveUsers).toBeDefined());
        resolveUsers({ data: [profile] });

        expect(await screen.findByRole('heading', { name: 'Ada Runner' })).toBeVisible();
        expect(screen.getByText('Biegam długie dystanse.')).toBeVisible();
        expect(screen.getByText('@ada-runner')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj znajomego' })).not.toBeInTheDocument();
        expect(feedService.getFeeds).not.toHaveBeenCalled();
        expect(storyService.getStories).not.toHaveBeenCalled();
    });

    it('renders the empty profile state when the requested user does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderProfile();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(screen.queryByRole('heading', { name: 'Ada Runner' })).not.toBeInTheDocument();
    });

    it('lets the profile owner edit and delete the account and create profile content', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: profile.id, link: profile.link };
        renderProfile();

        expect(await screen.findByRole('heading', { name: 'Ada Runner' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Powiadomienia' })).toHaveAttribute(
            'href',
            '/users/ada-runner/notifications',
        );
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Edytuj profil' }));
        expect(screen.getByRole('dialog', { name: 'Edycja profilu' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij edycję' }));

        await user.click(screen.getByRole('button', { name: 'Dodaj relację' }));
        expect(screen.getByRole('dialog', { name: 'Nowa relacja' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij relację' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj wpis' }));
        expect(screen.getByRole('dialog', { name: 'Nowy wpis' })).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Usuń profil' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(userService.deleteUser).toHaveBeenCalledWith({ params: { path: { id: profile.id } } });
            expect(mocks.logout).toHaveBeenCalledOnce();
            expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
        });
    });

    it('shows friendship actions to a signed-in visitor and sends a friend request', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'viewer-1', link: 'viewer' };
        renderProfile();

        expect(await screen.findByRole('button', { name: 'Dodaj znajomego' })).toBeVisible();
        expect(friendService.getFriends).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({ filter: { userIds: ['viewer-1', profile.id] } }),
                }),
            }),
        );

        await user.click(screen.getByRole('button', { name: 'Dodaj znajomego' }));
        await waitFor(() => {
            expect(friendService.createFriend).toHaveBeenCalledWith({ body: { userId: profile.id } });
        });
        expect(feedService.getFeeds).not.toHaveBeenCalled();
        expect(storyService.getStories).not.toHaveBeenCalled();
    });

    it('allows administrators to moderate profile status without owner controls', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderProfile();

        expect(await screen.findByRole('button', { name: 'Zmień status profilu' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj profil' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń profil' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Powiadomienia' })).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Zmień status profilu' }));
        await waitFor(() => {
            expect(userService.updateUserStatus).toHaveBeenCalledWith({
                params: { path: { id: profile.id } },
                body: { status: 3 },
            });
        });
    });

    it('accepts an incoming friendship request', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'viewer-1', link: 'viewer' };
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: profile.id,
                    receiverUserId: 'viewer-1',
                    status: FriendStatusEnum.PENDING,
                },
            ],
        } as never);
        renderProfile();

        await user.click(await screen.findByRole('button', { name: 'Akceptuj znajomość' }));
        await waitFor(() => {
            expect(friendService.updateFriendStatus).toHaveBeenCalledWith({
                params: { path: { id: 'friendship-1' } },
                body: { status: FriendStatusEnum.ACCEPTED },
            });
        });
    });
});
