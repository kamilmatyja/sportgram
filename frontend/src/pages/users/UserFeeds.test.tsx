import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { feedService, friendService, userService, type FeedResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserFeeds from './UserFeeds';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isAdmin: false,
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

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(3)}>Zmień status wpisu</button>
        ),
        FeedModal: ({ opened, feed, onClose }: { opened: boolean; feed?: FeedResource | null; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label={feed ? 'Edycja wpisu' : 'Nowy wpis'}>
                    <p>{feed?.text}</p>
                    <button onClick={onClose}>Zamknij formularz wpisu</button>
                </section>
            ) : null,
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const feeds = [
    {
        id: 'feed-1',
        userId: profile.id,
        text: 'Poranny trening',
        photo: '',
        status: 2,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
        comments: [],
        reactions: [],
        feedOrigin: null,
    },
    {
        id: 'feed-2',
        userId: profile.id,
        text: 'Bieg w parku',
        photo: '',
        status: 1,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
        comments: [],
        reactions: [],
        feedOrigin: null,
    },
] as FeedResource[];

function renderFeeds() {
    return render(
        <Routes>
            <Route path="/users/:link/feeds" element={<UserFeeds />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/feeds'] },
    );
}

describe('UserFeeds', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(feedService, 'getFeeds').mockResolvedValue({
            data: feeds,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(feedService, 'updateFeedStatus').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'deleteFeed').mockResolvedValue({} as never);
    });

    it('shows loading and then the owner’s posts with management actions', async () => {
        let resolveFeeds!: (value: { data: FeedResource[]; pagination: { total: number } }) => void;
        vi.mocked(feedService.getFeeds).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFeeds = resolve;
                }) as never,
        );
        renderFeeds();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveFeeds).toBeDefined());
        resolveFeeds({ data: feeds, pagination: { total: 2 } });

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.getByText('Bieg w parku')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wpis' })).toBeVisible();
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(feedService.getFeeds).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, text: null, status: null },
                        sort: 'createdAt:desc',
                        'include[]': ['feedOrigin'],
                    }),
                }),
            }),
        );
    });

    it('allows the owner to create, edit and delete posts', async () => {
        const user = userEvent.setup();
        renderFeeds();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj wpis' }));
        expect(screen.getByRole('dialog', { name: 'Nowy wpis' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz wpisu' }));

        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        expect(screen.getByRole('dialog', { name: 'Edycja wpisu' })).toHaveTextContent('Poranny trening');

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(feedService.deleteFeed).toHaveBeenCalledWith({ params: { path: { id: 'feed-1' } } });
        });
    });

    it('filters posts by text, sorts and changes page', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.getFeeds).mockResolvedValue({
            data: feeds.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderFeeds();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Treść'), ' poranny ');

        await waitFor(() => {
            expect(feedService.getFeeds).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, text: 'poranny', status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tekst: A do Z'));
        await waitFor(() => {
            expect(feedService.getFeeds).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'text:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(feedService.getFeeds).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('shows an empty state when the profile has no posts', async () => {
        vi.mocked(feedService.getFeeds).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderFeeds();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wpis' })).toBeVisible();
    });

    it('allows an administrator to change post status but not create, edit or delete posts', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderFeeds();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj wpis' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status wpisu' })[0]);
        await waitFor(() => {
            expect(feedService.updateFeedStatus).toHaveBeenCalledWith({
                params: { path: { id: 'feed-1' } },
                body: { status: 3 },
            });
        });
    });

    it('allows an accepted friend to view posts without management actions', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend' };
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: profile.id,
                    receiverUserId: 'friend-1',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        renderFeeds();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Dodaj wpis' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        renderFeeds();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(feedService.getFeeds).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderFeeds();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(feedService.getFeeds).not.toHaveBeenCalled();
    });
});
