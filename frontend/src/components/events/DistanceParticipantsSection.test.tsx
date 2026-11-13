import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import {
    eventService,
    type EventDisciplineDistanceListResource,
    type EventDisciplineDistanceResource,
    type UserResource,
} from '../../api/services';
import type * as CommonModule from '../common';
import type * as HooksModule from '../../hooks';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';
import { DistanceParticipantsSection } from './DistanceParticipantsSection';

const mocks = vi.hoisted(() => ({
    getUser: vi.fn(),
}));

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return { ...hooks, useUsersMap: () => ({ getUser: mocks.getUser }) };
});

vi.mock('../common', async (importOriginal: () => Promise<typeof CommonModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: ElementStatusEnum) => void }) => (
            <button onClick={() => onStatusChange(ElementStatusEnum.REJECTED)}>Zmień status</button>
        ),
    };
});

const participants = [
    {
        id: 'list-1',
        eventDisciplineDistanceId: 'distance-1',
        userId: 'runner-1',
        status: ElementStatusEnum.ACTIVE,
        results: [],
    },
    {
        id: 'list-2',
        eventDisciplineDistanceId: 'distance-1',
        userId: 'runner-2',
        status: ElementStatusEnum.DRAFT,
        results: [],
    },
] as unknown as EventDisciplineDistanceListResource[];

const distance = {
    id: 'distance-1',
    eventDisciplineId: 'discipline-1',
    distance: 5000,
    subDistances: [],
} as unknown as EventDisciplineDistanceResource;

const users: Record<string, UserResource> = {
    'runner-1': {
        id: 'runner-1',
        link: 'runner-one',
        firstName: 'Ada',
        lastName: 'Biegaczka',
    } as UserResource,
    'runner-2': {
        id: 'runner-2',
        link: 'runner-two',
        firstName: 'Jan',
        lastName: 'Runner',
    } as UserResource,
};

function renderSection(props: Partial<React.ComponentProps<typeof DistanceParticipantsSection>> = {}) {
    return render(
        <DistanceParticipantsSection
            distance={distance}
            isOwner={false}
            isParticipant={false}
            onSignUp={vi.fn()}
            isSigningUp={false}
            {...props}
        />,
    );
}

describe('DistanceParticipantsSection', () => {
    beforeEach(() => {
        notifications.clean();
        mocks.getUser.mockImplementation((id: string) => users[id]);
        vi.spyOn(eventService, 'getEventDisciplineDistanceLists').mockResolvedValue({
            data: participants,
        } as never);
        vi.spyOn(eventService, 'updateEventDisciplineDistanceListStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'createEventDisciplineDistanceResult').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'updateEventDisciplineDistanceResult').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'deleteEventDisciplineDistanceResult').mockResolvedValue({} as never);
    });

    it('loads the participant list with names, statuses, distance, and profile links', async () => {
        renderSection();

        expect(await screen.findByText('Ada Biegaczka')).toBeVisible();
        expect(screen.getByText('Jan Runner')).toBeVisible();
        expect(screen.getByText('5km')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })[0]).toHaveAttribute('href', '/users/runner-one');
        expect(eventService.getEventDisciplineDistanceLists).toHaveBeenCalledWith({
            params: {
                query: {
                    filter: { eventDisciplineDistanceId: 'distance-1' },
                    'include[]': ['eventListResults', 'eventListSubResults'],
                },
            },
        });
    });

    it('shows a loading indicator while participant data is pending', () => {
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockReturnValue(new Promise(() => {}) as never);
        const { container } = renderSection();

        expect(container.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        expect(screen.queryByText('Brak danych do wyświetlenia')).not.toBeInTheDocument();
    });

    it('shows an empty state when there are no participants or the request fails', async () => {
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockResolvedValueOnce({ data: [] } as never);
        const { rerender } = renderSection();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();

        vi.mocked(eventService.getEventDisciplineDistanceLists).mockRejectedValueOnce(new Error('Request failed'));
        rerender(
            <DistanceParticipantsSection
                distance={{ ...distance, id: 'distance-error' }}
                isOwner={false}
                isParticipant={false}
                onSignUp={vi.fn()}
                isSigningUp={false}
            />,
        );
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('lets an eligible participant sign up and suppresses the action when already listed', async () => {
        const user = userEvent.setup();
        const onSignUp = vi.fn();
        const { rerender } = renderSection({
            isParticipant: true,
            currentUserId: 'runner-3',
            onSignUp,
        });

        await user.click(await screen.findByRole('button', { name: 'Zapisz się' }));
        expect(onSignUp).toHaveBeenCalledWith('distance-1');

        rerender(
            <DistanceParticipantsSection
                distance={distance}
                isOwner={false}
                isParticipant
                currentUserId="runner-1"
                onSignUp={onSignUp}
                isSigningUp={false}
            />,
        );
        await screen.findByText('Ada Biegaczka');
        expect(screen.queryByRole('button', { name: 'Zapisz się' })).not.toBeInTheDocument();
    });

    it('disables the participant sign-up button while the request is pending', async () => {
        renderSection({ isParticipant: true, currentUserId: 'runner-3', isSigningUp: true });

        expect(await screen.findByRole('button', { name: 'Zapisz się' })).toBeDisabled();
    });

    it('allows the organizer to update participant status and reports failures', async () => {
        const user = userEvent.setup();
        vi.mocked(eventService.updateEventDisciplineDistanceListStatus).mockRejectedValueOnce({
            message: 'Nie udało się zmienić statusu',
        });
        renderSection({ isOwner: true });

        await screen.findByText('Ada Biegaczka');
        await user.click(screen.getAllByRole('button', { name: 'Zmień status' })[0]);

        await waitFor(() => {
            expect(eventService.updateEventDisciplineDistanceListStatus).toHaveBeenCalledWith({
                params: { path: { id: 'list-1' } },
                body: { status: ElementStatusEnum.REJECTED },
            });
        });
        expect(await screen.findByText('Nie udało się zmienić statusu')).toBeVisible();
    });

    it('keeps participant status actions self-service and hides organizer controls from other viewers', async () => {
        const user = userEvent.setup();
        renderSection({ isParticipant: true, currentUserId: 'runner-1' });

        await screen.findByText('Ada Biegaczka');
        expect(screen.getAllByRole('button', { name: 'Zmień status' })).toHaveLength(1);
        expect(screen.queryByRole('button', { name: 'Dodaj wynik' })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Zmień status' }));

        expect(eventService.updateEventDisciplineDistanceListStatus).toHaveBeenCalledWith({
            params: { path: { id: 'list-1' } },
            body: { status: ElementStatusEnum.REJECTED },
        });
    });

    it('shows organizer result-entry actions for active participants', async () => {
        const user = userEvent.setup();
        renderSection({ isOwner: true });

        await screen.findByText('Ada Biegaczka');
        expect(screen.getAllByRole('button', { name: 'Dodaj wynik' })).toHaveLength(1);
        await user.click(screen.getAllByRole('button', { name: 'Dodaj wynik' })[0]);
        expect(screen.getByRole('dialog')).toBeVisible();
        expect(screen.getByRole('spinbutton', { name: /5km/ })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Zapisz' })).toBeDisabled();
    });
});
