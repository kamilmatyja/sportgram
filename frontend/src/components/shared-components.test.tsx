import { describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';
import NotFound from './NotFound';
import { StatusBadge } from './common/StatusBadge';
import { StatusActionMenu } from './common/StatusActionMenu';
import { InteractionModal } from './common/InteractionModal';
import { render, screen, userEvent, within } from '../test/test-utils';

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

describe('shared components', () => {
    it('shows an empty state and its optional action', () => {
        render(
            <EmptyState
                title="Brak wyników"
                description="Zmień kryteria wyszukiwania"
                action={<button>Wyczyść</button>}
            />,
        );

        expect(screen.getByRole('heading', { name: 'Brak wyników' })).toBeVisible();
        expect(screen.getByText('Zmień kryteria wyszukiwania')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Wyczyść' })).toBeVisible();
    });

    it('renders an explicit status label', () => {
        render(<StatusBadge label="Aktywny" color="green" />);
        expect(screen.getByText('Aktywny')).toBeVisible();
    });

    it('sends a status selection to its callback', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <StatusActionMenu
                value="draft"
                options={[
                    { value: 'draft', label: 'Szkic' },
                    { value: 'published', label: 'Opublikowany' },
                ]}
                onChange={onChange}
                tooltipLabel="Zmień status"
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Zmień status' }));
        await user.click(screen.getByText('Opublikowany'));
        expect(onChange).toHaveBeenCalledWith('published');
    });

    it('shows modal content and delegates closing', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <InteractionModal opened onClose={onClose} title="Edycja">
                <p>Treść formularza</p>
            </InteractionModal>,
        );

        expect(screen.getByText('Treść formularza')).toBeVisible();
        await user.click(within(screen.getByRole('dialog')).getByRole('button'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('returns to the home page from the not-found view', async () => {
        const user = userEvent.setup();
        render(
            <>
                <NotFound />
                <LocationPath />
            </>,
            { initialEntries: ['/missing'] },
        );

        expect(screen.getByText('404')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Kokpit' }));
        expect(screen.getByLabelText('current location')).toHaveTextContent('/');
    });

    it('supports row actions, search, add, pagination and empty/loading states', async () => {
        const user = userEvent.setup();
        const onSearchChange = vi.fn();
        const onAdd = vi.fn();
        const onPageChange = vi.fn();
        const onRowAction = vi.fn();
        const columns = [{ key: 'name', header: 'Nazwa' }];
        const actions = (row: { name: string }) => (
            <button onClick={() => onRowAction(row.name)}>Otwórz {row.name}</button>
        );
        const view = render(
            <DataTable
                columns={columns}
                data={[{ id: 'one', name: 'Bieg' }]}
                search=""
                onSearchChange={onSearchChange}
                onAdd={onAdd}
                addLabel="Dodaj rekord"
                page={1}
                totalPages={2}
                onPageChange={onPageChange}
                actions={actions}
            />,
        );

        await user.type(screen.getByRole('textbox', { name: 'Szukaj...' }), 'bieg');
        expect(onSearchChange).toHaveBeenLastCalledWith('g');
        await user.click(screen.getByRole('button', { name: 'Dodaj rekord' }));
        await user.click(screen.getByRole('button', { name: 'Otwórz Bieg' }));
        expect(onAdd).toHaveBeenCalledOnce();
        expect(onRowAction).toHaveBeenCalledWith('Bieg');
        await user.click(screen.getByRole('button', { name: '2' }));
        expect(onPageChange).toHaveBeenCalledWith(2);

        view.rerender(<DataTable columns={columns} data={[]} isLoading={false} />);
        expect(screen.getByText('Brak danych do wyświetlenia')).toBeVisible();

        view.rerender(<DataTable columns={columns} data={[]} isLoading />);
        expect(document.querySelectorAll('.mantine-Skeleton-root').length).toBeGreaterThan(0);
    });
});
