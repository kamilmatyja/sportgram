import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../test/test-utils';
import { DataTable, type DataTableStateLike } from './DataTable';

const columns = [
    { key: 'name', header: 'Nazwa' },
    { key: 'status', header: 'Status' },
];
const rows = [
    { id: '1', name: 'Bieg', status: 'Aktywny' },
    { id: '2', name: 'Rower', status: 'Szkic' },
];

describe('DataTable', () => {
    it('passes sort changes to the state handler and displays the selected sort', async () => {
        const user = userEvent.setup();
        const onSortChange = vi.fn();
        render(<DataTable columns={columns} data={rows} sort="createdAt:desc" onSortChange={onSortChange} />);

        const sort = screen.getByRole('combobox', { name: 'Sortuj według' });
        expect(sort).toHaveValue('Data utworzenia: od najnowszych');
        await user.click(sort);
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        expect(onSortChange).toHaveBeenCalledWith(
            'status:asc',
            expect.objectContaining({ value: 'status:asc', label: 'Status: rosnąco' }),
        );
    });

    it('changes pages and page size using the supplied table state', async () => {
        const user = userEvent.setup();
        const state: DataTableStateLike = {
            page: 2,
            limit: 10,
            sort: 'createdAt:desc',
            setPage: vi.fn(),
            onLimitChange: vi.fn(),
            onSortChange: vi.fn(),
        };
        render(<DataTable columns={columns} data={rows} state={state} totalItems={37} />);

        expect(screen.getByText('Razem: 37')).toBeVisible();
        await user.click(screen.getByRole('button', { name: '3' }));
        expect(state.setPage).toHaveBeenCalledWith(3);

        const pageSize = screen.getByRole('combobox', { name: 'strona' });
        await user.click(pageSize);
        await user.keyboard('{ArrowDown}');
        await user.keyboard('{Enter}');
        expect(state.onLimitChange).toHaveBeenCalledWith(20);
    });

    it('shows filters on demand and invokes reset only when active filters exist', async () => {
        const user = userEvent.setup();
        const onResetFilters = vi.fn();
        render(
            <DataTable
                columns={columns}
                data={rows}
                filtersNode={<input aria-label="Status filtra" />}
                activeFiltersCount={2}
                onResetFilters={onResetFilters}
            />,
        );

        expect(screen.queryByRole('textbox', { name: 'Status filtra' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Filtry/ })).toHaveTextContent('2');
        const filtersButton = screen.getByRole('button', { name: /Filtry/ });
        await user.click(filtersButton);
        expect(filtersButton).toHaveAttribute('data-variant', 'filled');
        await user.click(filtersButton);
        expect(filtersButton).toHaveAttribute('data-variant', 'light');

        await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
        expect(onResetFilters).toHaveBeenCalledOnce();
    });

    it('reports search changes and invokes per-row actions with the matching record', async () => {
        const user = userEvent.setup();
        const onSearchChange = vi.fn();
        const onRowAction = vi.fn();
        render(
            <DataTable
                columns={columns}
                data={rows}
                search=""
                searchPlaceholder="Szukaj wpisów"
                onSearchChange={onSearchChange}
                actions={(row) => <button onClick={() => onRowAction(row.id)}>Otwórz {row.name}</button>}
            />,
        );

        await user.type(screen.getByRole('textbox', { name: 'Szukaj wpisów' }), 'bieg');
        expect(onSearchChange).toHaveBeenLastCalledWith('g');

        await user.click(screen.getByRole('button', { name: 'Otwórz Rower' }));
        expect(onRowAction).toHaveBeenCalledWith('2');
    });

    it('renders an empty state and loading skeletons instead of rows', () => {
        const { rerender, container } = render(<DataTable columns={columns} data={[]} />);
        expect(screen.getByText('Brak danych do wyświetlenia')).toBeVisible();

        rerender(<DataTable columns={columns} data={rows} isLoading />);
        expect(screen.queryByText('Bieg')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.mantine-Skeleton-root')).toHaveLength(10);
    });
});
