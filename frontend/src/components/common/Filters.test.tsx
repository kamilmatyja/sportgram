import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '../../test/test-utils';
import { useDataTableState } from '../../hooks/useDataTableState';
import { DataTable } from '../DataTable';
import { TextStatusFilter } from './TextStatusFilter';
import { TitleLinkStatusFilter } from './TitleLinkStatusFilter';

function ControlledTextStatusFilter({
    onTextChange = vi.fn(),
    onStatusChange = vi.fn(),
    onFilterChange = vi.fn(),
}: {
    onTextChange?: (value: string) => void;
    onStatusChange?: (value: string | null) => void;
    onFilterChange?: () => void;
}) {
    const [text, setText] = useState('');
    const [status, setStatus] = useState<string | null>(null);

    return (
        <TextStatusFilter
            text={text}
            status={status}
            onTextChange={(value) => {
                setText(value);
                onTextChange(value);
            }}
            onStatusChange={(value) => {
                setStatus(value);
                onStatusChange(value);
            }}
            onFilterChange={onFilterChange}
        />
    );
}

function FilteredTable() {
    const tableState = useDataTableState({ initialPage: 3, initialLimit: 10 });
    const [title, setTitle] = useState('Bieg');
    const [link, setLink] = useState('bieg');
    const [status, setStatus] = useState<string | null>('2');
    const activeFiltersCount = Number(!!title) + Number(!!link) + Number(!!status);

    return (
        <>
            <output aria-label="current page">{tableState.page}</output>
            <TitleLinkStatusFilter
                title={title}
                onTitleChange={setTitle}
                link={link}
                onLinkChange={setLink}
                status={status}
                onStatusChange={setStatus}
                onFilterChange={tableState.resetPage}
            />
            <DataTable
                columns={[{ key: 'name', header: 'Nazwa' }]}
                data={[{ id: 'one', name: 'Bieg' }]}
                state={tableState}
                totalPages={3}
                totalItems={21}
                filtersNode={<span>Filtry dostępne</span>}
                activeFiltersCount={activeFiltersCount}
                onResetFilters={() => {
                    setTitle('');
                    setLink('');
                    setStatus(null);
                    tableState.resetPage();
                }}
            />
        </>
    );
}

describe('shared filter components', () => {
    it('reports text and status changes and invokes the filter callback', async () => {
        const user = userEvent.setup();
        const onTextChange = vi.fn();
        const onStatusChange = vi.fn();
        const onFilterChange = vi.fn();
        render(
            <ControlledTextStatusFilter
                onTextChange={onTextChange}
                onStatusChange={onStatusChange}
                onFilterChange={onFilterChange}
            />,
        );

        await user.type(screen.getByRole('textbox', { name: 'Treść' }), 'bieg');
        expect(onTextChange).toHaveBeenLastCalledWith('bieg');
        expect(onFilterChange).toHaveBeenCalledTimes(4);

        const status = screen.getByRole('combobox', { name: 'Status' });
        await user.click(status);
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onStatusChange).toHaveBeenCalledWith('1');
        expect(onFilterChange).toHaveBeenCalledTimes(5);

        const clearStatus = document.querySelector('.mantine-InputClearButton-root');
        expect(clearStatus).toBeInTheDocument();
        if (!clearStatus) throw new Error('Status clear control was not rendered');
        fireEvent.click(clearStatus);
        expect(onStatusChange).toHaveBeenLastCalledWith(null);
        expect(onFilterChange).toHaveBeenCalledTimes(6);
    });

    it('reports title, link and status changes through their callbacks', async () => {
        const user = userEvent.setup();
        const onTitleChange = vi.fn();
        const onLinkChange = vi.fn();
        const onStatusChange = vi.fn();
        const onFilterChange = vi.fn();
        render(
            <TitleLinkStatusFilter
                title=""
                onTitleChange={onTitleChange}
                link=""
                onLinkChange={onLinkChange}
                status={null}
                onStatusChange={onStatusChange}
                onFilterChange={onFilterChange}
            />,
        );

        fireEvent.change(screen.getByRole('textbox', { name: 'Tytuł' }), { target: { value: 'Bieg' } });
        fireEvent.change(screen.getByRole('textbox', { name: 'Link' }), { target: { value: 'bieg' } });
        expect(onTitleChange).toHaveBeenLastCalledWith('Bieg');
        expect(onLinkChange).toHaveBeenLastCalledWith('bieg');

        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{Enter}');
        expect(onStatusChange).toHaveBeenCalledWith('1');
        expect(onFilterChange).toHaveBeenCalledTimes(3);
    });

    it('clears filter values, updates the active filter count and resets pagination', async () => {
        const user = userEvent.setup();
        render(<FilteredTable />);

        expect(screen.getByLabelText('current page')).toHaveTextContent('3');
        expect(screen.getByRole('button', { name: /Filtry/ })).toHaveTextContent('3');
        await user.clear(screen.getByRole('textbox', { name: 'Tytuł' }));
        expect(screen.getByLabelText('current page')).toHaveTextContent('1');
        expect(screen.getByRole('button', { name: /Filtry/ })).toHaveTextContent('2');
        await user.click(screen.getByRole('button', { name: '3' }));
        expect(screen.getByLabelText('current page')).toHaveTextContent('3');

        await user.click(screen.getByRole('button', { name: 'Wyczyść filtry' }));
        expect(screen.getByRole('textbox', { name: 'Tytuł' })).toHaveValue('');
        expect(screen.getByRole('textbox', { name: 'Link' })).toHaveValue('');
        expect(screen.getByLabelText('current page')).toHaveTextContent('1');
        expect(screen.getByRole('combobox', { name: 'Status' })).toHaveValue('');
        expect(screen.getByRole('button', { name: /Filtry/ })).not.toHaveTextContent('1');
        expect(screen.queryByRole('button', { name: 'Wyczyść filtry' })).not.toBeInTheDocument();
    });

    it('disables filter inputs when requested', () => {
        render(<TextStatusFilter text="" onTextChange={vi.fn()} status={null} onStatusChange={vi.fn()} disabled />);

        expect(screen.getByRole('textbox', { name: 'Treść' })).toBeDisabled();
        expect(screen.getByRole('combobox', { name: 'Status' })).toBeDisabled();
    });
});
