import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { trainingService } from '../../api/services';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import type { TrainingResource } from '../../api/services';
import UserTrainings from './UserTrainings';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    isOwner: true,
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return { ...hooks, useMyFriends: () => ({ collaboratorOptions: [] }) };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        UserSubpageContainer: ({
            children,
        }: {
            children: (context: {
                targetUser: { id: string; link: string; roles: { role: number }[] };
                isOwner: boolean;
                isAdmin: boolean;
            }) => React.ReactNode;
        }) =>
            children({
                targetUser: { id: 'user-1', link: 'runner', roles: [{ role: 3 }] },
                isOwner: mocks.isOwner,
                isAdmin: mocks.isAdmin,
            }),
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: number) => void }) => (
            <button onClick={() => onStatusChange(3)}>Zmień status treningu</button>
        ),
        TrainingFormModal: ({
            opened,
            training,
            onClose,
        }: {
            opened: boolean;
            training: TrainingResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={training ? 'Edycja treningu' : 'Nowy trening'}>
                    <p>{training?.title ?? 'Nowy trening'}</p>
                    <button onClick={onClose}>Zamknij formularz treningu</button>
                </section>
            ) : null,
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

const record = {
    id: 'training-1',
    userId: 'user-1',
    title: 'Bieg w parku',
    link: 'bieg-w-parku',
    location: 'Park',
    startedAt: '2026-10-10 08:00:00',
    endedAt: '2026-10-10 08:30:00',
    status: 1,
    disciplines: [],
    participants: [],
} as unknown as TrainingResource;

const secondRecord = {
    ...record,
    id: 'training-2',
    title: 'Rowerowy trening',
    link: 'rowerowy-trening',
    location: 'Las',
} as TrainingResource;

function renderTrainings() {
    return render(
        <Routes>
            <Route path="/users/:link/trainings" element={<UserTrainings />} />
        </Routes>,
        { initialEntries: ['/users/runner/trainings'] },
    );
}

describe('UserTrainings', () => {
    beforeEach(() => {
        mocks.isOwner = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(trainingService, 'getTrainings').mockResolvedValue({
            data: [record],
            pagination: { total: 1 },
        } as never);
        vi.spyOn(trainingService, 'updateTrainingStatus').mockResolvedValue({} as never);
        vi.spyOn(trainingService, 'deleteTraining').mockResolvedValue({} as never);
    });

    it('shows loading and then lists training details and the default query', async () => {
        let resolveTrainings!: (value: { data: TrainingResource[]; pagination: { total: number } }) => void;
        vi.mocked(trainingService.getTrainings).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveTrainings = resolve;
                }) as never,
        );
        renderTrainings();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveTrainings).toBeDefined());
        resolveTrainings({ data: [record, secondRecord], pagination: { total: 2 } });

        expect(await screen.findByText('Bieg w parku')).toBeVisible();
        expect(screen.getByText('Park')).toBeVisible();
        expect(screen.getByText('Rowerowy trening')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(trainingService.getTrainings).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: 'user-1', title: null, link: null, status: null },
                        sort: 'startedAt:desc',
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

    it('filters by title and link, changes sort order and paginates', async () => {
        const user = userEvent.setup();
        vi.mocked(trainingService.getTrainings).mockResolvedValue({
            data: [record],
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderTrainings();

        expect(await screen.findByText('Bieg w parku')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Tytuł'), ' Bieg ');
        await user.type(screen.getByLabelText('Link'), ' bieg-w-parku ');
        await waitFor(() => {
            expect(trainingService.getTrainings).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: 'user-1', title: 'Bieg', link: 'bieg-w-parku', status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tytuł: A do Z'));
        await waitFor(() => {
            expect(trainingService.getTrainings).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'title:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(trainingService.getTrainings).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets the owner create, edit, change status and delete a training', async () => {
        const user = userEvent.setup();
        renderTrainings();

        expect(await screen.findByText('Bieg w parku')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj trening' }));
        expect(screen.getByRole('dialog', { name: 'Nowy trening' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz treningu' }));

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja treningu' })).toHaveTextContent('Bieg w parku');
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz treningu' }));

        await user.click(screen.getByRole('button', { name: 'Zmień status treningu' }));
        await waitFor(() => {
            expect(trainingService.updateTrainingStatus).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
                body: { status: 3 },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(trainingService.deleteTraining).toHaveBeenCalledWith({ params: { path: { id: 'training-1' } } });
        });
    });

    it('does not offer create or edit controls to another permitted viewer', async () => {
        mocks.isOwner = false;
        renderTrainings();

        expect(await screen.findByText('Bieg w parku')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj trening' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status treningu' })).not.toBeInTheDocument();
    });

    it('allows administrators to change status but not create, edit or delete trainings', async () => {
        const user = userEvent.setup();
        mocks.isOwner = false;
        mocks.isAdmin = true;
        renderTrainings();

        expect(await screen.findByText('Bieg w parku')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj trening' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Zmień status treningu' }));
        await waitFor(() => {
            expect(trainingService.updateTrainingStatus).toHaveBeenCalledWith({
                params: { path: { id: 'training-1' } },
                body: { status: 3 },
            });
        });
    });

    it('shows an empty state without offering an add action to a non-owner', async () => {
        mocks.isOwner = false;
        vi.mocked(trainingService.getTrainings).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderTrainings();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj trening' })).not.toBeInTheDocument();
    });
});
