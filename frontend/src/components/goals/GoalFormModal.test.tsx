import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { goalService, type GoalResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as InteractionModalModule from '../common/InteractionModal';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { GoalFormModal } from './GoalFormModal';

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

const existingGoal = {
    id: 'goal-1',
    userId: 'owner-1',
    text: 'Przebiec półmaraton',
    link: 'przebiec-polmaraton',
    discipline: 1,
    distance: 21097,
    time: 7200,
    startedAt: '2026-06-20T08:30:00',
    endedAt: '2026-10-20T18:00:00',
    participants: [
        { id: 'participant-owner', userId: 'owner-1' },
        { id: 'participant-friend', userId: 'friend-1' },
    ],
} as unknown as GoalResource;

function renderForm(goal?: GoalResource | null) {
    return render(
        <GoalFormModal
            opened
            onClose={mocks.onClose}
            onSuccess={mocks.onSuccess}
            goal={goal}
            collaboratorOptions={collaboratorOptions}
        />,
    );
}

async function selectCollaborators(user: ReturnType<typeof userEvent.setup>, names: string[]) {
    const select = screen.getByRole('combobox', { name: 'Współuczestnicy' });
    for (const name of names) {
        await user.click(select);
        await user.click(await screen.findByText(name));
    }
}

async function fillRequiredGoalFields(user: ReturnType<typeof userEvent.setup>) {
    await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Przejechać 1000 km');
    await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
    await user.click(await screen.findByText('Jazda na rowerze'));
    await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '1000000.6');
}

describe('GoalFormModal', () => {
    beforeEach(() => {
        mocks.onClose.mockReset();
        mocks.onSuccess.mockReset();
        notifications.clean();
        vi.spyOn(goalService, 'createGoal').mockResolvedValue({} as never);
        vi.spyOn(goalService, 'updateGoal').mockResolvedValue({} as never);
    });

    it('requires a title, discipline and distance before enabling save', async () => {
        const user = userEvent.setup();
        renderForm();
        const save = screen.getByRole('button', { name: 'Zapisz' });

        expect(save).toBeDisabled();
        await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Nowy cel');
        expect(screen.getByRole('textbox', { name: 'Link' })).toHaveValue('nowy-cel');
        expect(save).toBeDisabled();

        await user.click(screen.getByRole('combobox', { name: 'Dyscyplina' }));
        await user.click(await screen.findByText('Bieganie'));
        expect(save).toBeDisabled();
        expect(goalService.createGoal).not.toHaveBeenCalled();
    });

    it('creates a goal with rounded distance, optional time and dates, selected discipline and participants', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillRequiredGoalFields(user);
        await user.type(screen.getByRole('textbox', { name: 'Czas [s]' }), '3600.5');
        const dateTimeInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
        expect(dateTimeInputs).toHaveLength(2);
        await user.type(dateTimeInputs[0], '2026-07-12T09:00');
        await user.type(dateTimeInputs[1], '2026-12-31T23:59');
        await selectCollaborators(user, ['Anna Biegaczka', 'Jan Kolarz']);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(goalService.createGoal).toHaveBeenCalledWith({
                body: {
                    text: 'Przejechać 1000 km',
                    link: 'przejechac-1000-km',
                    discipline: 2,
                    distance: 1000001,
                    time: 3601,
                    startedAt: '2026-07-12T09:00',
                    endedAt: '2026-12-31T23:59',
                    userIds: ['owner-1', 'friend-1', 'friend-2'],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Utworzono pomyślnie')).toBeVisible();
    });

    it('loads existing goal values and updates without losing the owner or existing participants', async () => {
        const user = userEvent.setup();
        renderForm(existingGoal);

        expect(await screen.findByRole('textbox', { name: 'Tytuł' })).toHaveValue('Przebiec półmaraton');
        expect(screen.getByRole('textbox', { name: 'Link' })).toHaveValue('przebiec-polmaraton');
        expect(screen.getByRole('textbox', { name: 'Dystans [m]' })).toHaveValue('21097');
        expect(screen.getByRole('textbox', { name: 'Czas [s]' })).toHaveValue('7200');
        const dateTimeInputs = document.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
        expect(dateTimeInputs[0]).toHaveValue('2026-06-20T08:30');
        expect(dateTimeInputs[1]).toHaveValue('2026-10-20T18:00');

        await user.clear(screen.getByRole('textbox', { name: 'Tytuł' }));
        await user.type(screen.getByRole('textbox', { name: 'Tytuł' }), 'Ukończyć półmaraton');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(goalService.updateGoal).toHaveBeenCalledWith({
                params: { path: { id: 'goal-1' } },
                body: {
                    text: 'Ukończyć półmaraton',
                    link: 'przebiec-polmaraton',
                    discipline: 1,
                    distance: 21097,
                    time: 7200,
                    startedAt: '2026-06-20T08:30',
                    endedAt: '2026-10-20T18:00',
                    userIds: ['owner-1', 'friend-1'],
                },
            });
        });
        expect(mocks.onClose).toHaveBeenCalledOnce();
        expect(mocks.onSuccess).toHaveBeenCalledOnce();
        expect(await screen.findByText('Zapisano pomyślnie')).toBeVisible();
    });

    it('sends null for optional empty time and dates and zero for a zero or invalid numeric value', async () => {
        const user = userEvent.setup();
        renderForm();
        await fillRequiredGoalFields(user);
        await user.clear(screen.getByRole('textbox', { name: 'Dystans [m]' }));
        await user.type(screen.getByRole('textbox', { name: 'Dystans [m]' }), '0');
        await user.type(screen.getByRole('textbox', { name: 'Czas [s]' }), 'not-a-number');
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        await waitFor(() => {
            expect(goalService.createGoal).toHaveBeenCalledWith(
                expect.objectContaining({
                    body: expect.objectContaining({
                        discipline: 2,
                        distance: 0,
                        time: null,
                        startedAt: null,
                        endedAt: null,
                    }),
                }),
            );
        });
    });

    it('shows field-level API validation errors and keeps the form open', async () => {
        const user = userEvent.setup();
        vi.mocked(goalService.createGoal).mockRejectedValueOnce({
            errors: [{ field: 'text', message: 'Taki cel już istnieje' }],
        });
        renderForm();
        await fillRequiredGoalFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Taki cel już istnieje')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });

    it('shows a general API error and does not close the form', async () => {
        const user = userEvent.setup();
        vi.mocked(goalService.createGoal).mockRejectedValueOnce({ message: 'Nie udało się zapisać celu' });
        renderForm();
        await fillRequiredGoalFields(user);
        await user.click(screen.getByRole('button', { name: 'Zapisz' }));

        expect(await screen.findByText('Nie udało się zapisać celu')).toBeVisible();
        expect(mocks.onClose).not.toHaveBeenCalled();
        expect(mocks.onSuccess).not.toHaveBeenCalled();
    });
});
