import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    feedService,
    friendService,
    userService,
    type FeedCommentResource,
    type UserResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as InteractionModalModule from '../../components/common/InteractionModal';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserFeedComments from './UserFeedComments';
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
            <button onClick={() => onChange(3)}>Zmień status komentarza</button>
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

const comments = [
    {
        id: 'comment-1',
        feedId: 'feed-1',
        userId: profile.id,
        text: 'Świetny trening!',
        status: 2,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'comment-2',
        feedId: 'feed-2',
        userId: profile.id,
        text: 'Do zobaczenia na trasie.',
        status: 1,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as FeedCommentResource[];

function renderComments() {
    return render(
        <Routes>
            <Route path="/users/:link/feed-comments" element={<UserFeedComments />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/feed-comments'] },
    );
}

describe('UserFeedComments', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        mocks.getAuthorLink.mockReset();
        mocks.getAuthorLink.mockReturnValue('feed-author');
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(feedService, 'getFeedComments').mockResolvedValue({
            data: comments,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(feedService, 'updateFeedComment').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'updateFeedCommentStatus').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'deleteFeedComment').mockResolvedValue({} as never);
    });

    it('shows loading and then the owner’s comments and actions', async () => {
        let resolveComments!: (value: { data: FeedCommentResource[]; pagination: { total: number } }) => void;
        vi.mocked(feedService.getFeedComments).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveComments = resolve;
                }) as never,
        );
        renderComments();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveComments).toBeDefined());
        resolveComments({ data: comments, pagination: { total: 2 } });

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        expect(screen.getByText('Do zobaczenia na trasie.')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(feedService.getFeedComments).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, text: null, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('filters comments by text, sorts and changes page', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.getFeedComments).mockResolvedValue({
            data: comments.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderComments();

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Treść'), ' świetny ');

        await waitFor(() => {
            expect(feedService.getFeedComments).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, text: 'świetny', status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tekst: A do Z'));
        await waitFor(() => {
            expect(feedService.getFeedComments).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'text:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(feedService.getFeedComments).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('shows an empty state when the profile has no comments', async () => {
        vi.mocked(feedService.getFeedComments).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderComments();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('allows the owner to edit a comment and reports API validation errors', async () => {
        const user = userEvent.setup();
        vi.mocked(feedService.updateFeedComment).mockRejectedValue({
            errors: [{ field: 'text', message: 'Komentarz jest niedozwolony' }],
        });
        renderComments();

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        const dialog = screen.getByRole('dialog', { name: 'Edytuj komentarz' });
        expect(dialog).toBeVisible();
        expect(screen.getByRole('textbox', { name: 'Treść' })).toHaveValue('Świetny trening!');

        await user.clear(screen.getByRole('textbox', { name: 'Treść' }));
        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'Zaktualizowany komentarz');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Komentarz jest niedozwolony')).toBeVisible();
        expect(feedService.updateFeedComment).toHaveBeenCalledWith({
            params: { path: { id: 'comment-1' } },
            body: { text: 'Zaktualizowany komentarz' },
        });
        expect(dialog).toBeInTheDocument();
    });

    it('lets the owner delete a comment', async () => {
        const user = userEvent.setup();
        renderComments();

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);

        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(feedService.deleteFeedComment).toHaveBeenCalledWith({
                params: { path: { id: 'comment-1' } },
            });
        });
    });

    it('allows an administrator to moderate comment status but not edit or delete', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderComments();

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status komentarza' })[0]);
        await waitFor(() => {
            expect(feedService.updateFeedCommentStatus).toHaveBeenCalledWith({
                params: { path: { id: 'comment-1' } },
                body: { status: 3 },
            });
        });
    });

    it('allows an accepted friend to view comments without management actions', async () => {
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
        renderComments();

        expect(await screen.findByText('Świetny trening!')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        renderComments();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(feedService.getFeedComments).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderComments();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(feedService.getFeedComments).not.toHaveBeenCalled();
    });
});
