import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { trainingService, userService } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import type { TrainingResource } from '../../api/services';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import TrainingDetails from './TrainingDetails';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: { id: 'owner-1', link: 'runner', roles: [] },
    canAccessSubpage: true,
    isAdmin: false,
    getUser: vi.fn((id: string) => ({ id, link: 'runner', firstName: 'Ada', lastName: 'Runner' })),
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser }) };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useMyFriends: () => ({ collaboratorOptions: [] }),
        useUsersMap: () => ({ getUser: mocks.getUser, usersMap: {}, isLoading: false }),
        useUserSubpageAccess: () => ({
            isAdmin: mocks.isAdmin,
            canAccessSubpage: mocks.canAccessSubpage,
            isLoading: false,
        }),
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        EntityViewCounter: () => <span>Wyświetlenia: 3</span>,
        TrainingRouteMap: ({ points }: { points: { lat: number; lng: number }[] }) => (
            <div aria-label="Mapa trasy">{JSON.stringify(points)}</div>
        ),
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: number) => void }) => (
            <button onClick={() => onStatusChange(ElementStatusEnum.ACTIVE)}>Zmień status</button>
        ),
        TrainingFormModal: ({
            opened,
            training,
            onClose,
        }: {
            opened: boolean;
            training: TrainingResource;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Edycja treningu">
                    <span>{training.title}</span>
                    <button onClick={onClose}>Zamknij formularz</button>
                </section>
            ) : null,
    };
});

const training = {
    id: 'training-1',
    userId: 'owner-1',
    title: 'Poranny bieg',
    link: 'poranny-bieg',
    description: 'Trening nad rzeką',
    location: 'Warszawa',
    startedAt: '2026-10-10 08:00:00',
    endedAt: '2026-10-10 08:30:00',
    status: 1,
    participants: [
        { id: 'participant-1', userId: 'owner-1', status: 1 },
        { id: 'participant-2', userId: 'friend-1', status: 1 },
    ],
    disciplines: [
        {
            id: 'discipline-1',
            discipline: 1,
            distances: [
                {
                    id: 'distance-1',
                    distance: 5000,
                    time: 1800,
                    subDistances: [
                        { id: 'split-1', subDistance: 2500, time: 900, lat: 52000000, lng: 21000000 },
                        { id: 'split-2', subDistance: 5000, time: 1800, lat: 52010000, lng: 21010000 },
                    ],
                },
            ],
        },
    ],
} as unknown as TrainingResource;

function renderTraining() {
    return render(
        <Routes>
            <Route path="/trainings/:link" element={<TrainingDetails />} />
            <Route path="/users/:link/trainings" element={<div>Treningi użytkownika</div>} />
        </Routes>,
        { initialEntries: ['/trainings/poranny-bieg'] },
    );
}

describe('TrainingDetails', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'owner-1', link: 'runner', roles: [] };
        mocks.canAccessSubpage = true;
        mocks.isAdmin = false;
        mocks.getUser.mockClear();
        mocks.confirmDelete.mockClear();
        vi.spyOn(trainingService, 'getTrainings').mockResolvedValue({ data: [training] } as never);
        vi.spyOn(trainingService, 'updateTrainingStatus').mockResolvedValue({} as never);
        vi.spyOn(trainingService, 'updateTrainingParticipantStatus').mockResolvedValue({} as never);
        vi.spyOn(trainingService, 'deleteTraining').mockResolvedValue({} as never);
        vi.spyOn(userService, 'getUser').mockResolvedValue({
            data: { id: 'owner-1', link: 'runner', roles: [], color: null },
        } as never);
    });

    it('shows training data and expands GPS splits on demand', async () => {
        const user = userEvent.setup();
        renderTraining();

        expect(await screen.findByRole('heading', { name: 'Poranny bieg' })).toBeVisible();
        expect(screen.getByText('Trening nad rzeką')).toBeVisible();
        expect(screen.getByRole('heading', { name: 'Uczestnicy' })).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(screen.getByText('5km')).toBeVisible();
        expect(screen.getByText('30m')).toBeVisible();
        expect(screen.getAllByText('Ada Runner')).toHaveLength(2);
        expect(screen.queryByLabelText('Mapa trasy')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Szczegóły' }));
        expect(screen.getByLabelText('Mapa trasy')).toHaveTextContent(
            JSON.stringify([
                { lat: 52, lng: 21 },
                { lat: 52.01, lng: 21.01 },
            ]),
        );
        expect(screen.getByText('2,5km')).toBeVisible();
    });

    it('offers owner actions and opens the training editor', async () => {
        const user = userEvent.setup();
        renderTraining();

        await screen.findByRole('heading', { name: 'Poranny bieg' });
        await user.click(screen.getByRole('button', { name: 'Edytuj' }));

        expect(screen.getByRole('dialog', { name: 'Edycja treningu' })).toHaveTextContent('Poranny bieg');
        expect(trainingService.getTrainings).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        filter: { link: 'poranny-bieg' },
                        limit: 1,
                        'include[]': [
                            'trainingDisciplines',
                            'trainingDisciplineDistances',
                            'trainingDisciplineSubDistances',
                            'trainingParticipants',
                        ],
                    }),
                }),
            }),
        );
    });

    it('shows loading until the training data arrives', async () => {
        let resolveTrainings!: (value: { data: TrainingResource[] }) => void;
        vi.mocked(trainingService.getTrainings).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveTrainings = resolve;
                }) as never,
        );
        renderTraining();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveTrainings).toBeDefined());
        resolveTrainings({ data: [training] });
        expect(await screen.findByRole('heading', { name: 'Poranny bieg' })).toBeVisible();
    });

    it('lets the owner update training and own participant status, then delete the training', async () => {
        const user = userEvent.setup();
        renderTraining();
        expect(await screen.findByRole('heading', { name: 'Poranny bieg' })).toBeVisible();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status' })[0]);
        await waitFor(() => {
            expect(trainingService.updateTrainingStatus).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Zmień status' })[1]);
        await waitFor(() => {
            expect(trainingService.updateTrainingParticipantStatus).toHaveBeenCalledWith({
                params: { path: { id: 'participant-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(trainingService.deleteTraining).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
            });
        });
        expect(await screen.findByText('Treningi użytkownika')).toBeVisible();
    });

    it('lets administrators change status but hides owner-only actions', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin', roles: [] };
        mocks.isAdmin = true;
        renderTraining();

        expect(await screen.findByRole('heading', { name: 'Poranny bieg' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zmień status' }));
        await waitFor(() => {
            expect(trainingService.updateTrainingStatus).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });
    });

    it('shows not-found and access-denied states', async () => {
        vi.mocked(trainingService.getTrainings).mockResolvedValueOnce({ data: [] } as never);
        const notFound = renderTraining();
        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        notFound.unmount();

        mocks.canAccessSubpage = false;
        renderTraining();
        expect(await screen.findByText('Brak dostępu')).toBeVisible();
    });

    it('hides owner controls for a permitted non-owner', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend', roles: [] };
        renderTraining();

        expect(await screen.findByRole('heading', { name: 'Poranny bieg' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('shows empty states when the training has no participants or disciplines', async () => {
        vi.mocked(trainingService.getTrainings).mockResolvedValue({
            data: [{ ...training, participants: [], disciplines: [] }],
        } as never);
        renderTraining();

        expect(await screen.findAllByText('Brak danych do wyświetlenia')).toHaveLength(2);
    });
});
