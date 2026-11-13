import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { feedService, type FeedResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as UtilsModule from '../../utils';
import { FeedReactionEnum } from '../../enums/FeedReactionEnum';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { FeedCard } from './FeedCard';

const mocks = vi.hoisted(() => ({
    currentUser: null as { id: string; firstName?: string; lastName?: string; link?: string } | null,
    openConfirmActionModal: vi.fn(),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser }) };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, openConfirmActionModal: mocks.openConfirmActionModal };
});

vi.mock('../EntityViewCounter', () => ({
    EntityViewCounter: () => null,
}));

const author = {
    id: 'author-1',
    link: 'author',
    firstName: 'Ada',
    lastName: 'Runner',
    profilePhoto: 'https://example.test/author.jpg',
} as UserResource;

const ownComment = {
    id: 'comment-own',
    userId: 'viewer-1',
    text: 'Mój komentarz',
    createdAt: '2026-11-13T10:00:00Z',
};

const otherComment = {
    id: 'comment-other',
    userId: 'user-2',
    text: 'Komentarz znajomego',
    createdAt: '2026-11-13T10:01:00Z',
};

const baseFeed = {
    id: 'feed-1',
    userId: 'author-1',
    text: 'Poranny trening za nami!',
    photo: 'https://example.test/run.jpg',
    createdAt: '2026-11-13T09:00:00Z',
    reactions: [
        { id: 'reaction-1', userId: 'viewer-1', reaction: FeedReactionEnum.LIKE },
        { id: 'reaction-2', userId: 'user-2', reaction: FeedReactionEnum.LIKE },
        { id: 'reaction-3', userId: 'user-3', reaction: FeedReactionEnum.LOVE },
    ],
    comments: [ownComment, otherComment],
} as unknown as FeedResource;

const feedWithoutViewerReaction = {
    ...baseFeed,
    reactions: baseFeed.reactions?.filter((reaction) => reaction.userId !== 'viewer-1'),
} as FeedResource;

function renderCard(feed: FeedResource = baseFeed, props: Partial<React.ComponentProps<typeof FeedCard>> = {}) {
    return render(
        <FeedCard
            feed={feed}
            author={author}
            usersMap={{
                'viewer-1': { id: 'viewer-1', link: 'viewer', firstName: 'Iga', lastName: 'Biegaczka' } as UserResource,
                'user-2': { id: 'user-2', link: 'friend', firstName: 'Jan', lastName: 'Runner' } as UserResource,
            }}
            {...props}
        />,
    );
}

describe('FeedCard', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'viewer-1', firstName: 'Iga', lastName: 'Biegaczka', link: 'viewer' };
        mocks.openConfirmActionModal.mockReset();
        notifications.clean();
        vi.spyOn(feedService, 'createFeedReaction').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'updateFeedReaction').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'deleteFeedReaction').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'createFeedComment').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'updateFeedComment').mockResolvedValue({} as never);
        vi.spyOn(feedService, 'deleteFeedComment').mockResolvedValue({} as never);
    });

    it('shows feed text, image, author link, reaction counts and comment count', () => {
        renderCard();

        expect(screen.getByText('Poranny trening za nami!')).toBeVisible();
        expect(screen.getByRole('img', { name: 'Zdjęcie' })).toHaveAttribute('src', 'https://example.test/run.jpg');
        expect(screen.getByRole('link', { name: 'Ada Runner' })).toHaveAttribute('href', '/users/author');
        expect(screen.getByRole('button', { name: 'Lubię to' })).toHaveTextContent('2');
        expect(screen.getByRole('button', { name: 'Super' })).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: '2' })).toBeVisible();
    });

    it('shows edit and delete feed actions only to its owner and forwards callbacks', async () => {
        const user = userEvent.setup();
        const onEditFeed = vi.fn();
        const onDeleteFeed = vi.fn();
        mocks.currentUser = { id: 'author-1' };
        renderCard(baseFeed, { onEditFeed, onDeleteFeed });

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        await user.click(screen.getByRole('button', { name: 'Usuń' }));

        expect(onEditFeed).toHaveBeenCalledWith(baseFeed);
        expect(onDeleteFeed).toHaveBeenCalledWith('feed-1');
    });

    it('lets the viewer create a reaction and updates counts after success', async () => {
        const user = userEvent.setup();
        renderCard(feedWithoutViewerReaction);

        await user.click(screen.getByRole('button', { name: 'Haha' }));
        await waitFor(() => {
            expect(feedService.createFeedReaction).toHaveBeenCalledWith({
                params: { path: { id: 'feed-1' } },
                body: { type: FeedReactionEnum.HAHA },
            });
        });
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('updates or removes the viewer’s existing reaction', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByRole('button', { name: 'Super' }));
        await waitFor(() => {
            expect(feedService.updateFeedReaction).toHaveBeenCalledWith({
                params: { path: { id: 'reaction-1' } },
                body: { type: FeedReactionEnum.LOVE },
            });
        });

        await user.click(screen.getByRole('button', { name: /Lubię to/ }));
        await waitFor(() => {
            expect(feedService.deleteFeedReaction).toHaveBeenCalledWith({
                params: { path: { id: 'reaction-1' } },
            });
        });
    });

    it('opens comments and creates a comment with trimmed text', async () => {
        const user = userEvent.setup();
        renderCard();

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => expect(screen.getByText('Mój komentarz')).toBeVisible());
        expect(screen.getByText('Komentarz znajomego')).toBeVisible();

        await user.type(screen.getByRole('textbox', { name: 'Napisz komentarz...' }), '  Świetny trening!  ');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));
        await waitFor(() => {
            expect(feedService.createFeedComment).toHaveBeenCalledWith({
                params: { path: { id: 'feed-1' } },
                body: { text: 'Świetny trening!' },
            });
        });
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('allows editing and deleting only the current user’s comment', async () => {
        const user = userEvent.setup();
        renderCard();
        await user.click(screen.getByRole('button', { name: '2' }));

        await waitFor(() => expect(screen.getByText('Mój komentarz')).toBeVisible());
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(1);
        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        const editInput = screen.getByDisplayValue('Mój komentarz');
        await user.clear(editInput);
        await user.type(editInput, 'Zmieniony komentarz');
        await user.click(screen.getAllByRole('button', { name: 'Zapisz' })[0]);

        await waitFor(() => {
            expect(feedService.updateFeedComment).toHaveBeenCalledWith({
                params: { path: { id: 'comment-own' } },
                body: { text: 'Zmieniony komentarz' },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.openConfirmActionModal).toHaveBeenCalledOnce();
        mocks.openConfirmActionModal.mock.calls[0][0].onConfirm();
        await waitFor(() =>
            expect(feedService.deleteFeedComment).toHaveBeenCalledWith({
                params: { path: { id: 'comment-own' } },
            }),
        );
    });

    it.each([
        ['reaction', 'createFeedReaction', FeedReactionEnum.HAHA, 'Nie udało się dodać reakcji'],
        ['comment', 'createFeedComment', 'Komentarz', 'Nie udało się dodać komentarza'],
    ] as const)('shows a notification when adding a %s fails', async (_name, method, value, message) => {
        const user = userEvent.setup();
        vi.mocked(feedService[method]).mockRejectedValueOnce({ message });
        renderCard(feedWithoutViewerReaction);

        if (method === 'createFeedReaction') {
            await user.click(screen.getByRole('button', { name: 'Haha' }));
        } else {
            await user.click(screen.getByRole('button', { name: '2' }));
            await user.type(await screen.findByRole('textbox', { name: 'Napisz komentarz...' }), String(value));
            await user.click(screen.getByRole('button', { name: 'Zapisz' }));
        }

        expect(await screen.findByText(message)).toBeVisible();
    });
});
