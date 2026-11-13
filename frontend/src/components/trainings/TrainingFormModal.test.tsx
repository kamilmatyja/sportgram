import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { trainingService, type TrainingResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as InteractionModalModule from '../common/InteractionModal';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { TrainingFormModal } from './TrainingFormModal';

const mocks = vi.hoisted(() => ({
    onClose: vi.fn(),
    onSuccess: vi.fn(),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: { id: 'owner-1' } }) };
});

vi.mock('../common/InteractionModal', async (importOriginal: () => Promise<typeof InteractionModalModule>) => {
    const common = await importOriginal();
    return {
        ...common,
        InteractionModal: ({ children, title }: { children: React.ReactNode; title: string }) => (
            <div role="dialog" aria-label={title}>
                {children}
            </div>
        ),
        InteractionBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});

const collaboratorOptions = [
    { value: 'friend-1', label: 'Anna Biegaczka' },
    { value: 'friend-2', label: 'Jan Kolarz' },
];

const existingTraining = {
    id: 'training-1',
    userId: 'owner-1',
    title: 'Poranny trening',
    description: 'Trening w parku.',
    link: 'poranny-trening',
    location: 'Warszawa',
    startedAt: '2026-06-20T08:30:00',
    endedAt: '2026-06-20T09:30:00',
    participants: [
        { id: 'participant-owner', userId: 'owner-1' },
        { id: 'participant-friend', userId: 'friend-1' },
    ],
    disciplines: [
        {
            id: 'discipline-1',
            discipline: 1,
            distances: [
                {
                    id: 'distance-1',
                    distance: 10000,
                    time: 3600,
                    subDistances: [
                        {
                            id: 'sub-distance-1',
                            subDistance: 5000,
                            time: 1800,
                            lat: 52123457,
                            lng: 21987654,
                            accuracy: 6,
                            speed: 0,
                        },
                    ],
                },
            ],
        },
    ],
} as unknown as TrainingResource;

function renderForm(training?: TrainingResource | null) {
    return render(
        <TrainingFormModal
            opened
            onClose={mocks.onClose}
            onSuccess={mocks.onSuccess}
            training={training}
            collaboratorOptions={collaboratorOptions}
        />,
    );
}

async function fillTrainingFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Bieg Charytatywny');
    await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Trening dla lokalnej fundacji.');
    await user.type(screen.getByRole('textbox', { name: 'Lokalizacja' }), 'Kraków');
    const dateTimeInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    if (dateTimeInputs.length !== 2) {
        throw new Error('Expected start and end date inputs');
    }
    await user.type(dateTimeInputs[0], '2026-07-12T09:00');
    await user.type(dateTimeInputs[1], '2026-07-12T10:30');
}

async function addDisciplineWithGpsSample(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
    await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
    await user.click(await screen.findByText('Bieganie'));
    await user.click(screen.getByRole('button', { name: 'Dodaj dystans ręcznie' }));
    await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '10000');
    await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[0], '3600');
    await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
    await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '5000');
    await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[1], '1800');
    await user.type(screen.getByRole('textbox', { name: 'Szerokość' }), '52.1234567');
    await user.type(screen.getByRole('textbox', { name: 'Długość' }), '21.9876543');
    await user.type(screen.getByRole('textbox', { name: 'Dokładność' }), '5.6');
    await user.type(screen.getByRole('textbox', { name: 'Prędkość' }), '-2');
}

async function selectCollaborators(user: ReturnType<typeof userEvent.setup>, names: string[]) {
    const select = screen.getByRole('combobox', { name: 'Współuczestnicy' });
    for (const name of names) {
        await user.click(select);
        await user.click(await screen.findByText(name));
    }
}

describe('TrainingFormModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        notifications.clean();
        vi.spyOn(trainingService, 'createTraining').mockResolvedValue({} as never);
        vi.spyOn(trainingService, 'updateTraining').mockResolvedValue({} as never);
    });

    it('requires training details and a valid discipline before allowing submission', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Nowy trening');
        expect(save).toBeDisabled();
        expect(trainingService.createTraining).not.toHaveBeenCalled();
    });

    it('creates a training with collaborators and maps its discipline, time and GPS data to the API DTO', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillTrainingFields(user);
        await selectCollaborators(user, ['Anna Biegaczka', 'Jan Kolarz']);
        await addDisciplineWithGpsSample(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(trainingService.createTraining).toHaveBeenCalledWith({
                body: {
                    title: 'Bieg Charytatywny',
                    description: 'Trening dla lokalnej fundacji.',
                    link: 'bieg-charytatywny',
                    location: 'Kraków',
                    startedAt: '2026-07-12T09:00',
                    endedAt: '2026-07-12T10:30',
                    userIds: ['owner-1', 'friend-1', 'friend-2'],
                    disciplines: [
                        {
                            discipline: 1,
                            distances: [
                                {
                                    distance: 10000,
                                    time: 3600,
                                    subDistances: [
                                        {
                                            subDistance: 5000,
                                            time: 1800,
                                            lat: 52123457,
                                            lng: 21987654,
                                            accuracy: 6,
                                            speed: 0,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('loads training fields, collaborators and GPS values and updates without losing the owner', async () => {
        const user = userEvent.setup();
        renderForm(existingTraining);

        expect(await screen.findByRole('textbox', { name: 'Tytuł' })).toHaveValue('Poranny trening');
        expect(screen.getByRole('textbox', { name: 'Opis' })).toHaveValue('Trening w parku.');
        expect(screen.getByRole('textbox', { name: 'Lokalizacja' })).toHaveValue('Warszawa');
        expect(screen.getByRole('textbox', { name: 'Szerokość' })).toHaveValue('52.123457');
        expect(screen.getByRole('textbox', { name: 'Długość' })).toHaveValue('21.987654');
        expect(screen.getByRole('textbox', { name: 'Dokładność' })).toHaveValue('6');
        expect(screen.getByRole('textbox', { name: 'Prędkość' })).toHaveValue('0');
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeEnabled();

        await user.clear(screen.getByRole('textbox', { name: 'Opis' }));
        await user.type(screen.getByRole('textbox', { name: 'Opis' }), 'Zaktualizowany opis treningu.');
        await selectCollaborators(user, ['Jan Kolarz']);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(trainingService.updateTraining).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
                body: {
                    title: 'Poranny trening',
                    description: 'Zaktualizowany opis treningu.',
                    link: 'poranny-trening',
                    location: 'Warszawa',
                    startedAt: '2026-06-20T08:30',
                    endedAt: '2026-06-20T09:30',
                    userIds: ['owner-1', 'friend-1', 'friend-2'],
                    disciplines: [
                        {
                            discipline: 1,
                            distances: [
                                {
                                    distance: 10000,
                                    time: 3600,
                                    subDistances: [
                                        {
                                            subDistance: 5000,
                                            time: 1800,
                                            lat: 52123457,
                                            lng: 21987654,
                                            accuracy: 6,
                                            speed: 0,
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('maps absent and invalid optional GPS measurements to null and clamps negative speed to zero', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillTrainingFields(user);
        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans ręcznie' }));
        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '0');
        await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[0], 'not-a-time');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '0');
        await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[1], '0');
        await user.type(screen.getByRole('textbox', { name: 'Szerokość' }), 'not-a-coordinate');
        await user.type(screen.getByRole('textbox', { name: 'Dokładność' }), 'invalid');
        await user.type(screen.getByRole('textbox', { name: 'Prędkość' }), '-4');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(trainingService.createTraining).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        disciplines: [
                            {
                                discipline: 1,
                                distances: [
                                    {
                                        distance: 0,
                                        time: 0,
                                        subDistances: [
                                            {
                                                subDistance: 0,
                                                time: 0,
                                                lat: null,
                                                lng: null,
                                                accuracy: null,
                                                speed: 0,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }),
                }),
            );
        });
    });

    it('preserves valid zero and boundary GPS coordinates when mapping to backend integers', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillTrainingFields(user);
        await user.click(screen.getByRole('button', { name: 'Dodaj dyscyplinę' }));
        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        await user.click(screen.getByRole('button', { name: 'Dodaj dystans ręcznie' }));
        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '100');
        await user.type(screen.getByRole('textbox', { name: 'Czas [s]' }), '60');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        await user.type(screen.getByRole('textbox', { name: 'Sub-dystans [m]' }), '50');
        await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[1], '30');
        await user.type(screen.getByRole('textbox', { name: 'Szerokość' }), '-90');
        await user.type(screen.getByRole('textbox', { name: 'Długość' }), '180');
        await user.click(screen.getByRole('button', { name: 'Dodaj sub-dystans' }));
        await user.type(screen.getAllByRole('textbox', { name: 'Sub-dystans [m]' })[1], '0');
        await user.type(screen.getAllByRole('textbox', { name: 'Czas [s]' })[2], '0');
        await user.type(screen.getAllByRole('textbox', { name: 'Szerokość' })[1], '0');
        await user.type(screen.getAllByRole('textbox', { name: 'Długość' })[1], '0');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(trainingService.createTraining).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        disciplines: [
                            {
                                discipline: 1,
                                distances: [
                                    {
                                        distance: 100,
                                        time: 60,
                                        subDistances: [
                                            {
                                                subDistance: 50,
                                                time: 30,
                                                lat: -90000000,
                                                lng: 180000000,
                                                accuracy: null,
                                                speed: null,
                                            },
                                            {
                                                subDistance: 0,
                                                time: 0,
                                                lat: 0,
                                                lng: 0,
                                                accuracy: null,
                                                speed: null,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }),
                }),
            );
        });
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(trainingService.createTraining).mockRejectedValueOnce({
            errors: [{ field: 'title', message: 'Tytuł treningu jest nieprawidłowy' }],
        });
        renderForm();
        await fillTrainingFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Tytuł treningu jest nieprawidłowy')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(trainingService.createTraining).mockRejectedValueOnce({
            message: 'Nie udało się zapisać treningu',
        });
        renderForm();
        await fillTrainingFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się zapisać treningu')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
