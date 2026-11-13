import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '../../test/test-utils';
import type { UserStoriesGroup } from '../StoryViewerModal';
import { StoriesBar } from './StoriesBar';

const groups: UserStoriesGroup[] = [
    {
        userId: 'user-1',
        author: {
            id: 'user-1',
            firstName: 'Ala',
            lastName: 'Biegaczka',
            profilePhoto: 'https://example.test/ala.jpg',
        } as UserStoriesGroup['author'],
        stories: [{ id: 'story-1' } as UserStoriesGroup['stories'][number]],
        newestStory: { id: 'story-1', photo: 'https://example.test/story.jpg' } as UserStoriesGroup['stories'][number],
    },
    {
        userId: 'user-2',
        author: {
            id: 'user-2',
            firstName: 'Jan',
            lastName: 'Runner',
            profilePhoto: 'https://example.test/jan.jpg',
        } as UserStoriesGroup['author'],
        stories: [{ id: 'story-2' } as UserStoriesGroup['stories'][number]],
        newestStory: { id: 'story-2' } as UserStoriesGroup['stories'][number],
    },
];

describe('StoriesBar', () => {
    it('renders story authors and uses the newest story photo or author avatar as a fallback', () => {
        render(<StoriesBar groups={groups} onSelectGroup={vi.fn()} />);

        expect(screen.getByText('Ala Biegaczka')).toBeVisible();
        expect(screen.getByText('Jan Runner')).toBeVisible();
        expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', 'https://example.test/story.jpg');
        expect(screen.getAllByRole('img')[1]).toHaveAttribute('src', 'https://example.test/jan.jpg');
    });

    it('renders an empty list without creating story items', () => {
        render(<StoriesBar groups={[]} onSelectGroup={vi.fn()} />);

        expect(screen.queryByRole('button', { name: 'Ala Biegaczka' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Jan Runner' })).not.toBeInTheDocument();
    });

    it('selects the clicked story group by its index', async () => {
        const user = userEvent.setup();
        const onSelectGroup = vi.fn();
        render(<StoriesBar groups={groups} onSelectGroup={onSelectGroup} />);

        await user.click(screen.getByRole('button', { name: /Jan Runner/ }));

        expect(onSelectGroup).toHaveBeenCalledWith(1);
    });

    it('supports story and feed creation actions', async () => {
        const user = userEvent.setup();
        const onAddStory = vi.fn();
        const onAddFeed = vi.fn();
        render(<StoriesBar groups={[]} onSelectGroup={vi.fn()} onAddStory={onAddStory} onAddFeed={onAddFeed} />);

        await user.click(screen.getByRole('button', { name: 'Dodaj relację' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj wpis' }));

        expect(onAddStory).toHaveBeenCalledOnce();
        expect(onAddFeed).toHaveBeenCalledOnce();
    });

    it('forwards scroll positions and the last story element ref', () => {
        const onScrollPositionChange = vi.fn();
        const lastStoryElementRef = vi.fn();
        const viewportRef = createRef<HTMLDivElement>();
        render(
            <StoriesBar
                groups={groups}
                onSelectGroup={vi.fn()}
                viewportRef={viewportRef}
                onScrollPositionChange={onScrollPositionChange}
                lastStoryElementRef={lastStoryElementRef}
            />,
        );

        const viewport = viewportRef.current;
        expect(viewport).toBeInTheDocument();
        expect(lastStoryElementRef).toHaveBeenCalledWith(screen.getByRole('button', { name: /Jan Runner/ }));

        if (!viewport) throw new Error('Stories viewport was not attached');
        fireEvent.scroll(viewport, { target: { scrollLeft: 120, scrollTop: 4 } });

        expect(onScrollPositionChange).toHaveBeenCalledWith(expect.objectContaining({ x: 120, y: 4 }));
    });

    it('shows loading placeholders and a fetching-more indicator', () => {
        const { container, rerender } = render(<StoriesBar groups={[]} onSelectGroup={vi.fn()} isLoading />);

        expect(container.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(10);
        expect(screen.queryByText('Ala Biegaczka')).not.toBeInTheDocument();

        rerender(<StoriesBar groups={[]} onSelectGroup={vi.fn()} isFetchingMore />);
        expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
    });

    it('keeps an empty bar usable when a failed fetch provides no groups', async () => {
        const user = userEvent.setup();
        const onAddStory = vi.fn();
        render(<StoriesBar groups={[]} onSelectGroup={vi.fn()} onAddStory={onAddStory} isLoading={false} />);

        expect(screen.queryByRole('button', { name: /Ala Biegaczka/ })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Dodaj relację' }));
        expect(onAddStory).toHaveBeenCalledOnce();
    });
});
