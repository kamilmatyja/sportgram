import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '../../test/test-utils';
import { EventDisciplinesEditor, type FormEventDiscipline } from './EventDisciplinesEditor';

function renderEditor(initialDisciplines: FormEventDiscipline[] = [], disabled = false) {
    const onChange = vi.fn();

    function ControlledEditor() {
        const [disciplines, setDisciplines] = useState(initialDisciplines);

        return (
            <>
                <EventDisciplinesEditor
                    disciplines={disciplines}
                    onChange={(next) => {
                        onChange(next);
                        setDisciplines(next);
                    }}
                    disabled={disabled}
                />
                <output data-testid="disciplines">{JSON.stringify(disciplines)}</output>
            </>
        );
    }

    render(<ControlledEditor />);
    return { onChange };
}

function readDisciplines() {
    const output = screen.getByTestId('disciplines').textContent;
    if (!output) {
        throw new Error('Discipline state was not rendered');
    }
    return JSON.parse(output) as FormEventDiscipline[];
}

describe('EventDisciplinesEditor', () => {
    it('adds a discipline, edits its selection, and adds editable distance and sub-distance values', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor();

        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        const addedDiscipline = readDisciplines()[0];
        expect(addedDiscipline).toEqual({ id: expect.any(String), discipline: null, distances: [] });

        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans' }));
        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '10000');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '5000');

        expect(readDisciplines()).toEqual([
            {
                id: addedDiscipline.id,
                discipline: '1',
                distances: [
                    {
                        id: expect.any(String),
                        distance: '10000',
                        subDistances: [{ id: expect.any(String), subDistance: '5000' }],
                    },
                ],
            },
        ]);
        expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
    });

    it('removes the selected discipline from the form state', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor([
            { id: 'running', discipline: '1', distances: [] },
            { id: 'cycling', discipline: '2', distances: [] },
        ]);

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);

        expect(readDisciplines()).toEqual([{ id: 'cycling', discipline: '2', distances: [] }]);
        expect(onChange).toHaveBeenLastCalledWith([{ id: 'cycling', discipline: '2', distances: [] }]);
    });

    it('removes only the selected distance and keeps the remaining distance and sub-distances', async () => {
        const user = userEvent.setup();
        const initial = [
            {
                id: 'running',
                discipline: '1',
                distances: [
                    { id: 'short', distance: '5000', subDistances: [{ id: 'short-sub', subDistance: '2500' }] },
                    { id: 'long', distance: '10000', subDistances: [] },
                ],
            },
        ];
        const { onChange } = renderEditor(initial);

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[1]);

        expect(readDisciplines()).toEqual([
            {
                id: 'running',
                discipline: '1',
                distances: [{ id: 'long', distance: '10000', subDistances: [] }],
            },
        ]);
        expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
    });

    it('removes only the selected sub-distance', async () => {
        const user = userEvent.setup();
        const initial = [
            {
                id: 'running',
                discipline: '1',
                distances: [
                    {
                        id: 'short',
                        distance: '5000',
                        subDistances: [
                            { id: 'first', subDistance: '2500' },
                            { id: 'second', subDistance: '1000' },
                        ],
                    },
                ],
            },
        ];
        const { onChange } = renderEditor(initial);

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[2]);

        expect(readDisciplines()).toEqual([
            {
                id: 'running',
                discipline: '1',
                distances: [{ id: 'short', distance: '5000', subDistances: [{ id: 'second', subDistance: '1000' }] }],
            },
        ]);
        expect(onChange).toHaveBeenLastCalledWith(readDisciplines());
    });

    it('prevents adding disciplines and distances while disabled', async () => {
        const user = userEvent.setup();
        const { onChange } = renderEditor([{ id: 'running', discipline: '1', distances: [] }], true);

        expect(screen.getByRole('button', { name: 'Dodaj dyscyplinę' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Dodaj dystans' })).toBeDisabled();
        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans' }));

        expect(readDisciplines()).toEqual([{ id: 'running', discipline: '1', distances: [] }]);
        expect(onChange).not.toHaveBeenCalled();
    });
});
