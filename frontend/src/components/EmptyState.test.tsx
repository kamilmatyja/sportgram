import { describe, expect, it } from 'vitest';
import { EmptyState } from './EmptyState';
import { render, screen } from '../test/test-utils';

describe('EmptyState', () => {
    it('shows its title, description, and optional action', () => {
        render(
            <EmptyState
                title="Brak wyników"
                description="Zmień kryteria wyszukiwania"
                action={<button>Wyczyść filtry</button>}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Brak wyników' })).toBeVisible();
        expect(screen.getByText('Zmień kryteria wyszukiwania')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Wyczyść filtry' })).toBeVisible();
    });

    it('omits the description and action when they are not provided', () => {
        render(<EmptyState title="Pusta lista" />);

        expect(screen.getByRole('heading', { name: 'Pusta lista' })).toBeVisible();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
