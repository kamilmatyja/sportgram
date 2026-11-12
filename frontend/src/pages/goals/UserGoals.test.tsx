import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { goalService, type GoalResource } from '../../api/services';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import UserGoals from './UserGoals';
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
            <button onClick={() => onStatusChange(GoalStatusEnum.ACTIVE)}>Zmień status celu</button>
        ),
        GoalFormModal: ({
            opened,
            goal,
            onClose,
        }: {
            opened: boolean;
            goal: GoalResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={goal ? 'Edycja celu' : 'Nowy cel'}>
                    <p>{goal?.text ?? 'Nowy cel'}</p>
                    <button onClick={onClose}>Zamknij formularz celu</button>
                </section>
            ) : null,
    };
});

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

const goal = {
    id: 'goal-1',
    userId: 'user-1',
    text: 'Przebiec półmaraton',
    link: 'polmaraton',
    discipline: 1,
    distance: 21097,
    time: 7200,
    startedAt: '2026-10-10 08:00:00',
    endedAt: '2026-12-10 08:00:00',
    status: GoalStatusEnum.ACTIVE,
    participants: [],
} as unknown as GoalResource;

const secondGoal = {
    ...goal,
    id: 'goal-2',
    text: 'Przepłynąć jezioro',
    link: 'plywanie',
    discipline: 5,
    status: GoalStatusEnum.DRAFT,
} as GoalResource;

function renderGoals() {
    return render(
        <Routes>
            <Route path="/users/:link/goals" element={<UserGoals />} />
        </Routes>,
        { initialEntries: ['/users/runner/goals'] },
    );
}

describe('UserGoals', () => {
    beforeEach(() => {
        mocks.isOwner = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(goalService, 'getGoals').mockResolvedValue({
            data: [goal],
            pagination: { total: 1 },
        } as never);
        vi.spyOn(goalService, 'updateGoalStatus').mockResolvedValue({} as never);
        vi.spyOn(goalService, 'deleteGoal').mockResolvedValue({} as never);
    });

    it('shows loading and then lists goal details and the default query', async () => {
        let resolveGoals!: (value: { data: GoalResource[]; pagination: { total: number } }) => void;
        vi.mocked(goalService.getGoals).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveGoals = resolve;
                }) as never,
        );
        renderGoals();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveGoals).toBeDefined());
        resolveGoals({ data: [goal, secondGoal], pagination: { total: 2 } });

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        expect(screen.getByText('@polmaraton')).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(screen.getByText('Przepłynąć jezioro')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(goalService.getGoals).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: {
                            userId: 'user-1',
                            text: null,
                            link: null,
                            discipline: null,
                            distance: null,
                            time: null,
                            status: null,
                        },
                        sort: 'createdAt:desc',
                        'include[]': ['goalParticipants'],
                    }),
                }),
            }),
        );
    });

    it('filters goals by text, link, discipline, distance, time and status', async () => {
        const user = userEvent.setup();
        renderGoals();

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Tytuł'), ' Półmaraton ');
        await user.type(screen.getByLabelText('Link'), ' polmaraton ');
        await user.type(screen.getByLabelText('Dystans [m]'), '21097');
        await user.type(screen.getByLabelText('Czas [s]'), '7200');

        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.keyboard('{ArrowDown}{Enter}');
        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(goalService.getGoals).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: {
                                userId: 'user-1',
                                text: 'Półmaraton',
                                link: 'polmaraton',
                                discipline: 1,
                                distance: 21097,
                                time: 7200,
                                status: GoalStatusEnum.DRAFT,
                            },
                        }),
                    }),
                }),
            );
        });
    }, 15000);

    it('sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(goalService.getGoals).mockResolvedValue({
            data: [goal],
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderGoals();

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}');
        await waitFor(() => {
            expect(goalService.getGoals).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'text:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(goalService.getGoals).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets the owner create, edit, change status and delete goals', async () => {
        const user = userEvent.setup();
        renderGoals();

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj cel' }));
        expect(screen.getByRole('dialog', { name: 'Nowy cel' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz celu' }));

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja celu' })).toHaveTextContent('Przebiec półmaraton');
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz celu' }));

        await user.click(screen.getByRole('button', { name: 'Zmień status celu' }));
        await waitFor(() => {
            expect(goalService.updateGoalStatus).toHaveBeenCalledWith({
                params: { path: { id: 'goal-1' } },
                body: { status: GoalStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(goalService.deleteGoal).toHaveBeenCalledWith({ params: { path: { id: 'goal-1' } } });
        });
    });

    it('does not offer management actions to another permitted viewer', async () => {
        mocks.isOwner = false;
        renderGoals();

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj cel' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status celu' })).not.toBeInTheDocument();
    });

    it('allows administrators to change status but not create, edit or delete goals', async () => {
        const user = userEvent.setup();
        mocks.isOwner = false;
        mocks.isAdmin = true;
        renderGoals();

        expect(await screen.findByText('Przebiec półmaraton')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj cel' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Zmień status celu' }));
        await waitFor(() => {
            expect(goalService.updateGoalStatus).toHaveBeenCalledWith({
                params: { path: { id: 'goal-1' } },
                body: { status: GoalStatusEnum.ACTIVE },
            });
        });
    });

    it('shows an empty state without offering an add action to a non-owner', async () => {
        mocks.isOwner = false;
        vi.mocked(goalService.getGoals).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderGoals();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj cel' })).not.toBeInTheDocument();
    });
});
