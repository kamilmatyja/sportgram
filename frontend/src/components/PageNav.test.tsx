import { describe, expect, it, vi } from 'vitest';
import type { PageResource } from '../api/services';
import { PageFollowStatusEnum } from '../enums/PageFollowStatusEnum';
import { render, screen } from '../test/test-utils';
import { PageNav } from './PageNav';

vi.mock('./EntityViewCounter', () => ({
    EntityViewCounter: ({ track }: { track: boolean }) => <output data-testid="view-counter">{String(track)}</output>,
}));

const page = {
    id: 'page-1',
    title: 'Klub Biegacza',
    link: 'klub-biegacza',
    backgroundPhoto: 'https://example.test/background.jpg',
    profilePhoto: 'https://example.test/profile.jpg',
    follows: [
        { id: 'accepted-1', status: PageFollowStatusEnum.ACCEPTED },
        { id: 'accepted-2', status: PageFollowStatusEnum.ACCEPTED },
        { id: 'pending-1', status: PageFollowStatusEnum.PENDING },
        { id: 'rejected-1', status: PageFollowStatusEnum.REJECTED },
    ],
} as unknown as PageResource;

describe('PageNav', () => {
    it('shows page identity, images, accepted follower count and extra actions', () => {
        render(<PageNav page={page} extraActions={<button>Obserwuj</button>} />, {
            initialEntries: ['/pages/klub-biegacza/posts'],
        });

        expect(screen.getByRole('heading', { name: 'Klub Biegacza' })).toBeVisible();
        expect(screen.getByText('@klub-biegacza')).toBeVisible();
        expect(screen.getByRole('img', { name: 'Klub Biegacza' })).toHaveAttribute(
            'src',
            'https://example.test/background.jpg',
        );
        expect(screen.getByText('2')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Obserwuj' })).toBeVisible();
        expect(screen.getByTestId('view-counter')).toHaveTextContent('false');
        expect(screen.getByRole('link', { name: 'Powrót' })).toHaveAttribute('href', '/pages/klub-biegacza');
    });

    it('hides detailed metadata in simplified mode', () => {
        render(<PageNav page={page} simplifiedHeader />, { initialEntries: ['/pages/klub-biegacza'] });

        expect(screen.queryByTestId('view-counter')).not.toBeInTheDocument();
        expect(screen.queryByText('2')).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Powrót do strony' })).not.toBeInTheDocument();
    });

    it('tracks views when displaying the detailed header on the page itself', () => {
        render(<PageNav page={page} />, { initialEntries: ['/pages/klub-biegacza'] });

        expect(screen.getByTestId('view-counter')).toHaveTextContent('true');
    });

    it('renders nothing when page data is absent', () => {
        const { container } = render(<PageNav page={null} />);

        expect(container.querySelector('.mantine-Title-root')).not.toBeInTheDocument();
    });
});
