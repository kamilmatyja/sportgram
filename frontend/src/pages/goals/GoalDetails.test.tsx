import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { Route, Routes } from 'react-router-dom';
import { goalService, userService, type GoalResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import GoalDetails from './GoalDetails';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: { id: 'owner-1', link: 'runner', roles: [] } as null | { id: string; link: string; roles: never[] },
    canAccessSubpage: true,
    isAdmin: false,
    getUser: vi.fn((id: string) => ({
        id,
        link: id === 'owner-1' ? 'runner' : 'friend',
        firstName: id === 'owner-1' ? 'Ada' : 'Ben',
        lastName: id === 'owner-1' ? 'Runner' : 'Friend',
    })),
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
        UserInfoCell: ({ user }: { user?: { firstName: string; lastName: string } }) => (
            <span>{user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'}</span>
        ),
        EntityViewCounter: () => <span>Wyświetlenia: 8</span>,
        StatusActionMenu: ({
            onStatusChange,
            options,
        }: {
            onStatusChange: (status: number) => void;
            options?: unknown[];
        }) => {
            const isGoalStatus = options?.length === 4;
            return (
                <button onClick={() => onStatusChange(isGoalStatus ? GoalStatusEnum.ACTIVE : SaveStatusEnum.ACCEPTED)}>
                    {isGoalStatus ? 'Zmień status celu' : 'Zmień status uczestnika'}
                </button>
            );
        },
        GoalFormModal: ({
            opened,
            goal: formGoal,
            onClose,
        }: {
            opened: boolean;
            goal: GoalResource;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Edycja celu">
                    <span>{formGoal.text}</span>
                    <button onClick={onClose}>Zamknij edycję celu</button>
                </section>
            ) : null,
    };
});

const goal = {
    id: 'goal-1',
    userId: 'owner-1',
    text: 'Przebiec półmaraton',
    link: 'polmaraton',
    discipline: 1,
    distance: 21097,
    time: 7200,
    startedAt: '2026-10-10T08:00:00',
    endedAt: '2026-12-10T08:00:00',
    status: GoalStatusEnum.ACTIVE,
    participants: [
        {
            id: 'participant-1',
            userId: 'owner-1',
            status: SaveStatusEnum.PENDING,
            results: [
                {
                    id: 'result-slower',
                    distance: 21097,
                    time: 7300,
                    status: SaveStatusEnum.PENDING,
                    createdAt: '2026-11-02T10:00:00',
                },
                {
                    id: 'result-faster',
                    distance: 21097,
                    time: 7000,
                    status: SaveStatusEnum.ACCEPTED,
                    createdAt: '2026-11-01T10:00:00',
                },
            ],
        },
        {
            id: 'participant-2',
            userId: 'friend-1',
            status: SaveStatusEnum.ACCEPTED,
            results: [],
        },
    ],
} as unknown as GoalResource;

function renderGoal(link = goal.link) {
    return render(
        <Routes>
            <Route path="/goals/:link" element={<GoalDetails />} />
            <Route path="/users/:link/goals" element={<div>Cele użytkownika</div>} />
        </Routes>,
        { initialEntries: [`/goals/${link}`] },
    );
}

describe('GoalDetails', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'owner-1', link: 'runner', roles: [] };
        mocks.canAccessSubpage = true;
        mocks.isAdmin = false;
        mocks.getUser.mockClear();
        mocks.confirmDelete.mockClear();
        vi.spyOn(goalService, 'getGoals').mockResolvedValue({ data: [goal] } as never);
        vi.spyOn(goalService, 'updateGoalStatus').mockResolvedValue({} as never);
        vi.spyOn(goalService, 'updateGoalParticipantStatus').mockResolvedValue({} as never);
        vi.spyOn(goalService, 'updateGoalParticipantResultStatus').mockResolvedValue({} as never);
        vi.spyOn(goalService, 'deleteGoal').mockResolvedValue({} as never);
        vi.spyOn(userService, 'getUser').mockResolvedValue({
            data: { id: 'owner-1', link: 'runner', roles: [], color: null },
        } as never);
    });

    it('shows loading before the goal details, participants and results', async () => {
        let resolveGoals!: (value: { data: GoalResource[] }) => void;
        vi.mocked(goalService.getGoals).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveGoals = resolve;
                }) as never,
        );
        renderGoal();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveGoals).toBeDefined());
        resolveGoals({ data: [goal] });

        expect(await screen.findByRole('heading', { name: 'Przebiec półmaraton' })).toBeVisible();
        expect(screen.getByText('@polmaraton')).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(screen.getAllByText('21,1km')).toHaveLength(3);
        expect(screen.getByText('2h')).toBeVisible();
        expect(screen.getByText('Wyświetlenia: 8')).toBeVisible();
        expect(screen.getAllByText('Ada Runner')).toHaveLength(3);
        expect(screen.getByText('Ben Friend')).toBeVisible();
        expect(goalService.getGoals).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: {
                        filter: { link: 'polmaraton' },
                        limit: 1,
                        'include[]': ['goalParticipants', 'goalParticipantResults'],
                    },
                }),
            }),
        );

        const fasterResultTime = screen.getByText('1h 56m 40s');
        const slowerResultTime = screen.getByText('2h 1m 40s');
        expect(
            fasterResultTime.compareDocumentPosition(slowerResultTime) & Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
    });

    it('lets the owner edit, update statuses, and delete the goal', async () => {
        const user = userEvent.setup();
        renderGoal();
        expect(await screen.findByRole('heading', { name: 'Przebiec półmaraton' })).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja celu' })).toHaveTextContent('Przebiec półmaraton');
        await user.click(screen.getByRole('button', { name: 'Zamknij edycję celu' }));

        await user.click(screen.getByRole('button', { name: 'Zmień status celu' }));
        await waitFor(() => {
            expect(goalService.updateGoalStatus).toHaveBeenCalledWith({
                params: { path: { id: 'goal-1' } },
                body: { status: GoalStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Zmień status uczestnika' })[0]);
        await waitFor(() => {
            expect(goalService.updateGoalParticipantStatus).toHaveBeenCalledWith({
                params: { path: { id: 'participant-1' } },
                body: { status: SaveStatusEnum.ACCEPTED },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Zmień status uczestnika' })[1]);
        await waitFor(() => {
            expect(goalService.updateGoalParticipantResultStatus).toHaveBeenCalledWith({
                params: { path: { id: 'result-faster' } },
                body: { status: SaveStatusEnum.ACCEPTED },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(goalService.deleteGoal).toHaveBeenCalledWith({ params: { path: { id: 'goal-1' } } });
        });
        expect(await screen.findByText('Cele użytkownika')).toBeVisible();
    });

    it('allows administrators to moderate goal status without owner actions', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin', roles: [] };
        mocks.isAdmin = true;
        renderGoal();

        expect(await screen.findByRole('heading', { name: 'Przebiec półmaraton' })).toBeVisible();
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

    it('shows an API error when updating the goal status fails', async () => {
        const user = userEvent.setup();
        notifications.clean();
        vi.mocked(goalService.updateGoalStatus).mockRejectedValueOnce(new Error('Nie można zmienić statusu celu'));
        renderGoal();

        await screen.findByRole('heading', { name: 'Przebiec półmaraton' });
        await user.click(screen.getByRole('button', { name: 'Zmień status celu' }));

        expect(await screen.findByText('Nie można zmienić statusu celu')).toBeVisible();
        expect(goalService.updateGoalStatus).toHaveBeenCalledWith({
            params: { path: { id: 'goal-1' } },
            body: { status: GoalStatusEnum.ACTIVE },
        });
    });

    it('hides goal management and own result actions from a permitted visitor', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor', roles: [] };
        renderGoal();

        expect(await screen.findByRole('heading', { name: 'Przebiec półmaraton' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status celu' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status uczestnika' })).not.toBeInTheDocument();
    });

    it('shows not-found and access-denied states', async () => {
        vi.mocked(goalService.getGoals).mockResolvedValueOnce({ data: [] } as never);
        const notFound = renderGoal();
        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        notFound.unmount();

        mocks.canAccessSubpage = false;
        renderGoal();
        expect(await screen.findByText('Brak dostępu')).toBeVisible();
    });

    it('shows empty states when the goal has no participants or results', async () => {
        vi.mocked(goalService.getGoals).mockResolvedValue({
            data: [{ ...goal, participants: [] }],
        } as never);
        renderGoal();

        expect(await screen.findAllByText('Brak danych do wyświetlenia')).toHaveLength(2);
    });
});
