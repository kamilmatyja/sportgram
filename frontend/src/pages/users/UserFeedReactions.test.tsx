import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    feedService,
    friendService,
    userService,
    type FeedReactionResource,
    type UserResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserFeedReactions from './UserFeedReactions';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
    getAuthorLink: vi.fn(() => 'feed-author'),
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

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useFeedAuthors: () => ({ getAuthorLink: mocks.getAuthorLink }),
    };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(3)}>Zmień status polubienia</button>
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

const reactions = [
    {
        id: 'reaction-1',
        feedId: 'feed-1',
        userId: profile.id,
        reaction: 1,
        status: 2,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'reaction-2',
        feedId: 'feed-2',
        userId: profile.id,
        reaction: 2,
        status: 1,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as FeedReactionResource[];

function renderReactions() {
    return render(
        <Routes>
            <Route path="/users/:link/feed-reactions" element={<UserFeedReactions />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/feed-reactions'] },
    );
}

describe('UserFeedReactions', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        mocks.getAuthorLink.mockReset();
        mocks.getAuthorLink.mockReturnValue('feed-author');
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(feedService, 'getFeedReactions').mockResolvedValue({
            data: reactions,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(feedService, 'updateFeedReaction').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'updateFeedReactionStatus').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'deleteFeedReaction').mockResolvedValue({} as never);
    });

    it('shows loading and then the owner’s reactions and available actions', async () => {
        let resolveReactions!: (value: { data: FeedReactionResource[]; pagination: { total: number } }) => void;
        vi.mocked(feedService.getFeedReactions).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveReactions = resolve;
                }) as never,
        );
        renderReactions();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveReactions).toBeDefined());
        resolveReactions({ data: reactions, pagination: { total: 2 } });

        expect(await screen.findByText('Lubię to')).toBeVisible();
        expect(screen.getByText('Super')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(feedService.getFeedReactions).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, reaction: null, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('filters reactions by type, sorts and changes page', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.getFeedReactions).mockResolvedValue({
            data: reactions.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderReactions();

        expect(await screen.findByText('Lubię to')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));

        const reactionFilter = await screen.findByRole('combobox', { name: 'Reakcja' });
        await user.click(reactionFilter);
        await user.type(reactionFilter, 'Lubię to');
        await user.click(await screen.findByText('👍 Lubię to'));
        await waitFor(() => {
            expect(feedService.getFeedReactions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, reaction: 1, status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tekst: A do Z'));
        await waitFor(() => {
            expect(feedService.getFeedReactions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'reaction:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(feedService.getFeedReactions).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('shows an empty state when the user has no reactions', async () => {
        vi.mocked(feedService.getFeedReactions).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderReactions();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('lets the owner update a reaction and delete it', async () => {
        const user = userEvent.setup();
        renderReactions();

        expect(await screen.findByText('Lubię to')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);

        const reactionSelect = screen.getByRole('combobox', { name: 'Reakcja' });
        await user.click(reactionSelect);
        await user.type(reactionSelect, 'Super');
        await user.click(await screen.findByText('❤️ Super'));
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(feedService.updateFeedReaction).toHaveBeenCalledWith({
                params: { path: { id: 'reaction-1' } },
                body: { type: 2 },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(feedService.deleteFeedReaction).toHaveBeenCalledWith({
                params: { path: { id: 'reaction-1' } },
            });
        });
    });

    it('allows an administrator to moderate reaction status but not edit or delete', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderReactions();

        expect(await screen.findByText('Lubię to')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status polubienia' })[0]);
        await waitFor(() => {
            expect(feedService.updateFeedReactionStatus).toHaveBeenCalledWith({
                params: { path: { id: 'reaction-1' } },
                body: { status: 3 },
            });
        });
    });

    it('allows an accepted friend to view reactions without management actions', async () => {
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
        renderReactions();

        expect(await screen.findByText('Lubię to')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        renderReactions();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(feedService.getFeedReactions).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderReactions();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(feedService.getFeedReactions).not.toHaveBeenCalled();
    });
});
