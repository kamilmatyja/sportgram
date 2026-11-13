import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { feedService, storyService } from '../api/services';
import type * as AuthModule from '../auth';
import type * as ComponentsModule from '../components';
import type * as HooksModule from '../hooks';
import type { FeedResource, StoryResource, UserResource } from '../api/services';
import Home from './Home';
import { render, screen, userEvent } from '../test/test-utils';

const mocks = vi.hoisted(() => ({
    isAuthenticated: false,
    currentUser: null as { id: string; link: string } | null,
}));

vi.mock('../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            isAuthenticated: mocks.isAuthenticated,
            currentUser: mocks.currentUser,
        }),
    };
});

vi.mock('../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useUsersMap: () => ({
            usersMap: {
                'user-2': { id: 'user-2', link: 'alex', firstName: 'Alex', lastName: 'Runner' },
            },
            isLoading: false,
        }),
        useInfiniteScrollObserver: () => () => {},
    };
});

vi.mock('../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StoriesBar: ({
            groups,
            onAddStory,
            onAddFeed,
            onSelectGroup,
        }: {
            groups: { userId: string; author?: UserResource }[];
            onAddStory: () => void;
            onAddFeed: () => void;
            onSelectGroup: (index: number) => void;
        }) => (
            <section aria-label="Relacje">
                <button onClick={onAddStory}>Dodaj relację</button>
                <button onClick={onAddFeed}>Dodaj wpis</button>
                {groups.map((group, index) => (
                    <button key={group.userId} onClick={() => onSelectGroup(index)}>
                        Otwórz relację {group.author?.firstName}
                    </button>
                ))}
            </section>
        ),
        FeedCard: ({ feed, onEditFeed }: { feed: FeedResource; onEditFeed: (feed: FeedResource) => void }) => (
            <article>
                <p>{feed.text}</p>
                <button onClick={() => onEditFeed(feed)}>Edytuj wpis</button>
            </article>
        ),
        StoryModal: ({ opened, onClose }: { opened: boolean; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label="Edytor relacji">
                    <button onClick={onClose}>Zamknij relację</button>
                </section>
            ) : null,
        FeedModal: ({ opened, feed, onClose }: { opened: boolean; feed?: FeedResource | null; onClose: () => void }) =>
            opened ? (
                <section role="dialog" aria-label={feed ? 'Edycja wpisu' : 'Nowy wpis'}>
                    <p>{feed?.text ?? 'Nowy wpis'}</p>
                    <button onClick={onClose}>Zamknij wpis</button>
                </section>
            ) : null,
        StoryViewerModal: ({
            opened,
            groups,
            initialGroupIndex,
            onClose,
        }: {
            opened: boolean;
            groups: { author?: UserResource }[];
            initialGroupIndex: number;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Podgląd relacji">
                    <p>{groups[initialGroupIndex]?.author?.firstName}</p>
                    <button onClick={onClose}>Zamknij podgląd</button>
                </section>
            ) : null,
    };
});

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

const feed = {
    id: 'feed-1',
    userId: 'user-1',
    text: 'Mój pierwszy wpis',
    createdAt: '2026-10-10 08:00:00',
    reactions: [],
    comments: [],
} as unknown as FeedResource;

const story = {
    id: 'story-1',
    userId: 'user-2',
    text: 'Poranny trening',
    createdAt: '2026-10-10 09:00:00',
} as unknown as StoryResource;

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((res) => {
        resolve = res;
    });
    return { promise, resolve };
}

describe('Home', () => {
    beforeEach(() => {
        mocks.isAuthenticated = false;
        mocks.currentUser = null;
        vi.spyOn(feedService, 'getFeeds').mockResolvedValue({
            data: [feed],
            pagination: { page: 1, hasNextPage: false },
        } as never);
        vi.spyOn(storyService, 'getStories').mockResolvedValue({
            data: [story],
            pagination: { page: 1, hasNextPage: false },
        } as never);
    });

    it('shows guest welcome actions and routes to sign-in or registration', async () => {
        const user = userEvent.setup();
        render(
            <>
                <Home />
                <LocationPath />
            </>,
        );

        expect(screen.getByRole('heading', { name: 'Witaj w Sportgram!' })).toBeVisible();
        expect(screen.getByText('Zaloguj się lub utwórz konto, aby kontynuować.')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Logowanie' }));
        expect(screen.getByLabelText('current location')).toHaveTextContent('/sign');
        await user.click(screen.getByRole('button', { name: 'Rejestracja' }));
        expect(screen.getByLabelText('current location')).toHaveTextContent('/register');
        expect(feedService.getFeeds).not.toHaveBeenCalled();
        expect(storyService.getStories).not.toHaveBeenCalled();
    });

    it('shows authenticated feed and stories, and opens creation and viewing flows', async () => {
        const user = userEvent.setup();
        mocks.isAuthenticated = true;
        mocks.currentUser = { id: 'user-1', link: 'runner' };
        render(<Home />);

        expect(await screen.findByText('Mój pierwszy wpis')).toBeVisible();
        expect(await screen.findByRole('button', { name: 'Otwórz relację Alex' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj relację' }));
        expect(screen.getByRole('dialog', { name: 'Edytor relacji' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij relację' }));
        expect(screen.queryByRole('dialog', { name: 'Edytor relacji' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Dodaj wpis' }));
        expect(screen.getByRole('dialog', { name: 'Nowy wpis' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij wpis' }));
        await user.click(screen.getByRole('button', { name: 'Edytuj wpis' }));
        expect(screen.getByRole('dialog', { name: 'Edycja wpisu' })).toHaveTextContent('Mój pierwszy wpis');

        await user.click(screen.getByRole('button', { name: 'Otwórz relację Alex' }));
        expect(screen.getByRole('dialog', { name: 'Podgląd relacji' })).toHaveTextContent('Alex');
    });

    it('shows an empty feed state when the authenticated user has no posts', async () => {
        mocks.isAuthenticated = true;
        mocks.currentUser = { id: 'user-1', link: 'runner' };
        vi.mocked(feedService.getFeeds).mockResolvedValue({
            data: [],
            pagination: { page: 1, hasNextPage: false },
        } as never);
        vi.mocked(storyService.getStories).mockResolvedValue({
            data: [],
            pagination: { page: 1, hasNextPage: false },
        } as never);

        render(<Home />);

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj relację' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wpis' })).toBeVisible();
    });

    it('keeps the story bar usable when fetching stories fails', async () => {
        mocks.isAuthenticated = true;
        mocks.currentUser = { id: 'user-1', link: 'runner' };
        vi.mocked(storyService.getStories).mockRejectedValueOnce(new Error('Stories request failed'));
        vi.mocked(feedService.getFeeds).mockResolvedValue({
            data: [],
            pagination: { page: 1, hasNextPage: false },
        } as never);

        render(<Home />);

        expect(await screen.findByRole('region', { name: 'Relacje' })).toBeVisible();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj relację' })).toBeVisible();
        expect(screen.queryByRole('button', { name: /Otwórz relację/ })).not.toBeInTheDocument();
    });

    it('shows loading placeholders until the feed and stories requests resolve', async () => {
        mocks.isAuthenticated = true;
        mocks.currentUser = { id: 'user-1', link: 'runner' };
        const pendingFeeds = deferred<{ data: FeedResource[]; pagination: { page: number; hasNextPage: boolean } }>();
        const pendingStories = deferred<{
            data: StoryResource[];
            pagination: { page: number; hasNextPage: boolean };
        }>();
        vi.mocked(feedService.getFeeds).mockReturnValue(pendingFeeds.promise as never);
        vi.mocked(storyService.getStories).mockReturnValue(pendingStories.promise as never);

        render(<Home />);

        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0);
        pendingFeeds.resolve({ data: [feed], pagination: { page: 1, hasNextPage: false } });
        pendingStories.resolve({ data: [story], pagination: { page: 1, hasNextPage: false } });

        expect(await screen.findByText('Mój pierwszy wpis')).toBeVisible();
        expect(await screen.findByRole('button', { name: 'Otwórz relację Alex' })).toBeVisible();
    });
});
