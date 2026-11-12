import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    eventService,
    friendService,
    pageService,
    userService,
    type EventResource,
    type UserResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserEvents from './UserEvents';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isAdmin: mocks.isAdmin,
        }),
    };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useTitleLinkStatusFilter: (resetPage: () => void) => {
            const state = hooks.useTitleLinkStatusFilter(resetPage);
            return state;
        },
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
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: number) => void }) => (
            <button onClick={() => onStatusChange(3)}>Zmień status wydarzenia</button>
        ),
        EventFormModal: ({
            opened,
            event,
            pageOptions,
            onClose,
        }: {
            opened: boolean;
            event?: EventResource | null;
            pageOptions: { value: string; label: string }[];
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={event ? 'Edycja wydarzenia' : 'Nowe wydarzenie'}>
                    <p>{event?.title}</p>
                    <p>{pageOptions.map((option) => option.label).join(', ')}</p>
                    <button onClick={onClose}>Zamknij formularz wydarzenia</button>
                </section>
            ) : null,
    };
});

const profile = {
    id: 'organizer-1',
    link: 'ada-organizer',
    firstName: 'Ada',
    lastName: 'Organizer',
    roles: [{ id: 'role-1', role: RoleEnum.ORGANIZER }],
} as UserResource;

const participantProfile = {
    ...profile,
    id: 'participant-1',
    link: 'ada-runner',
    roles: [{ id: 'role-2', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const events = [
    {
        id: 'event-1',
        pageParticipantId: 'page-participant-1',
        title: 'Bieg miejski',
        description: 'Bieg uliczny.',
        link: 'bieg-miejski',
        location: 'Warszawa',
        rules: '',
        photo: '',
        status: 2,
        startedAt: '2026-11-10T09:00:00',
        endedAt: '2026-11-10T12:00:00',
        createdAt: '2026-10-10T09:00:00',
        updatedAt: '2026-10-10T09:00:00',
        disciplines: [],
    },
    {
        id: 'event-2',
        pageParticipantId: 'page-participant-2',
        title: 'Rowerowy maraton',
        description: 'Trasa poza miastem.',
        link: 'rowerowy-maraton',
        location: 'Kraków',
        rules: '',
        photo: '',
        status: 1,
        startedAt: '2026-11-09T09:00:00',
        endedAt: '2026-11-09T14:00:00',
        createdAt: '2026-10-09T09:00:00',
        updatedAt: '2026-10-09T09:00:00',
        disciplines: [],
    },
] as EventResource[];

const organizerPages = [
    {
        id: 'page-1',
        title: 'Klub Biegowy',
        link: 'klub-biegowy',
        userId: profile.id,
    },
];

function renderEvents(link = profile.link) {
    return render(
        <Routes>
            <Route path="/users/:link/events" element={<UserEvents />} />
        </Routes>,
        { initialEntries: [`/users/${link}/events`] },
    );
}

describe('UserEvents', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockImplementation(async (request) => {
            const link = request.params?.query?.filter?.link;
            return { data: link === participantProfile.link ? [participantProfile] : [profile] } as never;
        });
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(pageService, 'getPages').mockResolvedValue({ data: organizerPages } as never);
        vi.spyOn(eventService, 'getEvents').mockResolvedValue({
            data: events,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(eventService, 'updateEventStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'deleteEvent').mockResolvedValue({} as never);
    });

    it('shows loading and then the organizer’s events with management actions', async () => {
        let resolveEvents!: (value: { data: EventResource[]; pagination: { total: number } }) => void;
        vi.mocked(eventService.getEvents).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveEvents = resolve;
                }) as never,
        );
        renderEvents();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveEvents).toBeDefined());
        resolveEvents({ data: events, pagination: { total: 2 } });

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.getByText('Rowerowy maraton')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Dodaj wydarzenie' })).toBeVisible();
        expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, title: null, link: null, status: null },
                        sort: 'startedAt:desc',
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
                    }),
                }),
            }),
        );
    });

    it('filters by title and link, sorts and paginates events', async () => {
        const user = userEvent.setup();
        vi.mocked(eventService.getEvents).mockResolvedValue({
            data: events.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Tytuł'), ' Bieg ');
        await user.type(screen.getByLabelText('Link'), ' bieg-miejski ');

        await waitFor(() => {
            expect(eventService.getEvents).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, title: 'Bieg', link: 'bieg-miejski', status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tytuł: A do Z'));
        await waitFor(() => {
            expect(eventService.getEvents).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'title:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(eventService.getEvents).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('lets the owner create, edit and delete events', async () => {
        const user = userEvent.setup();
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj wydarzenie' }));
        expect(screen.getByRole('dialog', { name: 'Nowe wydarzenie' })).toBeVisible();
        expect(screen.getByRole('dialog', { name: 'Nowe wydarzenie' })).toHaveTextContent(
            'Klub Biegowy (@klub-biegowy)',
        );
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz wydarzenia' }));

        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        expect(screen.getByRole('dialog', { name: 'Edycja wydarzenia' })).toHaveTextContent('Bieg miejski');

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(eventService.deleteEvent).toHaveBeenCalledWith({ params: { path: { id: 'event-1' } } });
        });
    });

    it('allows the owner to change event status', async () => {
        const user = userEvent.setup();
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Zmień status wydarzenia' })[0]);
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: 3 },
            });
        });
    });

    it('shows an empty state when the organizer has no events', async () => {
        vi.mocked(eventService.getEvents).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderEvents();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wydarzenie' })).toBeVisible();
    });

    it('allows an administrator to moderate events but hides owner-only actions', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj wydarzenie' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status wydarzenia' })[0]);
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: 3 },
            });
        });
    });

    it('denies access to a non-organizer even when they own the profile', async () => {
        mocks.currentUser = { id: participantProfile.id, link: participantProfile.link };
        renderEvents(participantProfile.link);

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(eventService.getEvents).not.toHaveBeenCalled();
    });

    it('denies access to a friend whose profile does not have the organizer role', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend' };
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [participantProfile] } as never);
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: participantProfile.id,
                    receiverUserId: 'friend-1',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        renderEvents(participantProfile.link);

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(eventService.getEvents).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderEvents();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(eventService.getEvents).not.toHaveBeenCalled();
    });
});
