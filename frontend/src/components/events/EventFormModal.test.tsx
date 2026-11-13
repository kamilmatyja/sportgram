import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventService, type EventResource } from '../../api/services';
import type * as CommonModule from '../common';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { EventFormModal } from './EventFormModal';

const mocks = vi.hoisted(() => ({
    onClose: vi.fn(),
    onSuccess: vi.fn(),
}));

vi.mock('../common/InteractionModal', () => ({
    InteractionModal: ({ children, title }: { children: React.ReactNode; title: string }) => (
        <div role="dialog" aria-label={title}>
            {children}
        </div>
    ),
}));

vi.mock('../common', async (importOriginal: () => Promise<typeof CommonModule>) => ({
    ...(await importOriginal()),
    ImageInput: ({ label, onChange }: { label: string; onChange: (file: File | null) => void }) => (
        <label>
            {label}
            <input
                type="file"
                aria-label={label}
                accept="image/*"
                onChange={(event) => onChange(event.currentTarget.files?.[0] ?? null)}
            />
        </label>
    ),
}));

const pageOptions = [
    { value: 'page-participant-1', label: 'Klub Biegacza' },
    { value: 'page-participant-2', label: 'Grupa Rowerowa' },
];

const existingEvent = {
    id: 'event-1',
    pageParticipantId: 'page-participant-2',
    title: 'Bieg Miejski',
    description: 'Bieg przez centrum.',
    link: 'bieg-miejski',
    location: 'Warszawa',
    rules: 'Biegniemy fair play.',
    startedAt: '2026-06-20T08:30:00',
    endedAt: '2026-06-20T14:00:00',
    photo: 'existing-event-photo',
    disciplines: [
        {
            id: 'discipline-1',
            discipline: 1,
            distances: [
                {
                    id: 'distance-1',
                    distance: 10000,
                    subDistances: [{ id: 'sub-distance-1', subDistance: 5000 }],
                },
            ],
        },
    ],
} as unknown as EventResource;

function renderForm(event?: EventResource | null) {
    return render(
        <EventFormModal
            opened
            onClose={mocks.onClose}
            onSuccess={mocks.onSuccess}
            event={event}
            pageOptions={pageOptions}
        />,
    );
}

async function fillEventFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Bieg Charytatywny');
    await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Bieg dla lokalnej fundacji.');
    await user.type(screen.getByRole('textbox', { name: 'Lokalizacja' }), 'Kraków');
    await user.type(screen.getByRole('textbox', { name: 'Regulamin' }), 'Obowiązuje regulamin zawodów.');
    const dateTimeInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    if (dateTimeInputs.length !== 2) {
        throw new Error('Expected start and end date inputs');
    }
    await user.type(dateTimeInputs[0], '2026-07-12T09:00');
    await user.type(dateTimeInputs[1], '2026-07-12T15:00');
    await user.upload(screen.getByLabelText('Zdjęcie'), new File(['event-photo'], 'event.png', { type: 'image/png' }));
}

async function addDisciplineWithDistance(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
    await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
    await user.click(await screen.findByText('Bieganie'));
    await user.click(screen.getByRole('button', { name: 'Dodaj dystans' }));
    await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '10000');
    await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
    await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '5000');
}

describe('EventFormModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        vi.spyOn(eventService, 'createEvent').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'updateEvent').mockResolvedValue({} as never);
    });

    it('requires a page, event details, a photo and valid disciplines before creation', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.click(screen.getByRole('combobox', { name: 'Strona' }));
        await user.click(await screen.findByText('Klub Biegacza'));
        await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Bieg Testowy');
        expect(save).toBeDisabled();
        expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    it('blocks submission until every discipline, distance and sub-distance has a value', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.click(screen.getByRole('combobox', { name: 'Strona' }));
        await user.click(await screen.findByText('Klub Biegacza'));
        await fillEventFields(user);

        const save = screen.getByRole('button', { name: 'Zapisz' });
        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        expect(save).toBeDisabled();

        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans' }));
        expect(save).toBeDisabled();

        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '10000');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        expect(save).toBeDisabled();

        await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '5000');
        expect(save).toBeEnabled();
        expect(eventService.createEvent).not.toHaveBeenCalled();
    });

    it('creates an event mapped to the selected page participant, including its distances and photo', async () => {
        const user = userEvent.setup();
        renderForm();
        await user.click(screen.getByRole('combobox', { name: 'Strona' }));
        await user.click(await screen.findByText('Grupa Rowerowa'));
        await fillEventFields(user);
        await addDisciplineWithDistance(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(eventService.createEvent).toHaveBeenCalledWith({
                params: { path: { id: 'page-participant-2' } },
                body: {
                    title: 'Bieg Charytatywny',
                    description: 'Bieg dla lokalnej fundacji.',
                    link: 'bieg-charytatywny',
                    location: 'Kraków',
                    rules: 'Obowiązuje regulamin zawodów.',
                    startedAt: '2026-07-12T09:00',
                    endedAt: '2026-07-12T15:00',
                    photo: 'ZXZlbnQtcGhvdG8=',
                    disciplines: [
                        {
                            discipline: 1,
                            distances: [{ distance: 10000, subDistances: [{ subDistance: 5000 }] }],
                        },
                    ],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('loads existing event data and updates it while retaining its photo and mapping its distances', async () => {
        const user = userEvent.setup();
        renderForm(existingEvent);

        expect(await screen.findByRole('textbox', { name: 'Tytuł' })).toHaveValue('Bieg Miejski');
        expect(screen.getByRole('textbox', { name: 'Lokalizacja' })).toHaveValue('Warszawa');
        const dateTimeInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
        expect(dateTimeInputs).toHaveLength(2);
        expect(dateTimeInputs[0]).toHaveValue('2026-06-20T08:30');
        expect(screen.getByRole('textbox', { name: 'Dystans [m]' })).toHaveValue('10000');
        expect(screen.getByRole('textbox', { name: 'Sub-dystans [m]' })).toHaveValue('5000');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();

        await user.clear(screen.getByRole('textbox', { name: 'Opis' }));
        await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Zaktualizowany opis biegu.');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(eventService.updateEvent).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: {
                    title: 'Bieg Miejski',
                    description: 'Zaktualizowany opis biegu.',
                    link: 'bieg-miejski',
                    location: 'Warszawa',
                    rules: 'Biegniemy fair play.',
                    startedAt: '2026-06-20T08:30',
                    endedAt: '2026-06-20T14:00',
                    photo: 'existing-event-photo',
                    disciplines: [
                        {
                            discipline: 1,
                            distances: [{ distance: 10000, subDistances: [{ subDistance: 5000 }] }],
                        },
                    ],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(eventService.createEvent).mockRejectedValueOnce({
            errors: [{ field: 'title', message: 'Tytuł wydarzenia jest już zajęty' }],
        });
        renderForm();
        await user.click(screen.getByRole('combobox', { name: 'Strona' }));
        await user.click(await screen.findByText('Klub Biegacza'));
        await fillEventFields(user);
        await addDisciplineWithDistance(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Tytuł wydarzenia jest już zajęty')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(eventService.createEvent).mockRejectedValueOnce({ message: 'Nie udało się zapisać wydarzenia' });
        renderForm();
        await user.click(screen.getByRole('combobox', { name: 'Strona' }));
        await user.click(await screen.findByText('Klub Biegacza'));
        await fillEventFields(user);
        await addDisciplineWithDistance(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się zapisać wydarzenia')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
