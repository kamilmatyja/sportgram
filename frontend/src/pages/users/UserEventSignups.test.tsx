import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    eventService,
    friendService,
    pageService,
    userService,
    type EventDisciplineDistanceListResource,
    type EventResource,
    type PageResource,
    type UserResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';
import UserEventSignups from './UserEventSignups';
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

vi.mock('../../utils', async (importOriginal: () => Promise<typeof UtilsModule>) => {
    const utils = await importOriginal();
    return { ...utils, confirmDelete: mocks.confirmDelete };
});

vi.mock('../../components', async (importOriginal: () => Promise<typeof ComponentsModule>) => {
    const components = await importOriginal();
    return {
        ...components,
        StatusActionMenu: ({ onChange }: { onChange: (status: number) => void }) => (
            <button onClick={() => onChange(SaveStatusEnum.ACCEPTED)}>Zmień status zapisu</button>
        ),
    };
});

const profile = {
    id: 'participant-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    color: 1,
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const participantProfile = {
    ...profile,
    id: 'other-participant',
    link: 'jan-runner',
    firstName: 'Jan',
    lastName: 'Runner',
} as UserResource;

const signups = [
    {
        id: 'signup-1',
        eventDisciplineDistanceId: 'distance-1',
        feedId: 'feed-1',
        userId: profile.id,
        status: SaveStatusEnum.ACCEPTED,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
        results: [],
    },
    {
        id: 'signup-2',
        eventDisciplineDistanceId: 'distance-2',
        feedId: 'feed-2',
        userId: profile.id,
        status: SaveStatusEnum.PENDING,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
        results: [],
    },
] as EventDisciplineDistanceListResource[];

const events = [
    {
        id: 'event-1',
        pageParticipantId: 'page-participant-1',
        title: 'Bieg miejski',
        description: '',
        link: 'bieg-miejski',
        location: 'Warszawa',
        rules: '',
        photo: '',
        status: 2,
        startedAt: '2026-11-10T09:00:00',
        endedAt: '2026-11-10T12:00:00',
        createdAt: '2026-10-10T09:00:00',
        updatedAt: '2026-10-10T09:00:00',
        disciplines: [
            {
                id: 'discipline-1',
                eventId: 'event-1',
                discipline: 1,
                createdAt: '',
                updatedAt: '',
                distances: [
                    {
                        id: 'distance-1',
                        eventDisciplineId: 'discipline-1',
                        distance: 5000,
                        createdAt: '',
                        updatedAt: '',
                        subDistances: [],
                    },
                ],
            },
        ],
    },
    {
        id: 'event-2',
        pageParticipantId: 'page-participant-2',
        title: 'Rowerowy maraton',
        description: '',
        link: 'rowerowy-maraton',
        location: 'Kraków',
        rules: '',
        photo: '',
        status: 2,
        startedAt: '2026-11-09T09:00:00',
        endedAt: '2026-11-09T14:00:00',
        createdAt: '2026-10-09T09:00:00',
        updatedAt: '2026-10-09T09:00:00',
        disciplines: [
            {
                id: 'discipline-2',
                eventId: 'event-2',
                discipline: 2,
                createdAt: '',
                updatedAt: '',
                distances: [
                    {
                        id: 'distance-2',
                        eventDisciplineId: 'discipline-2',
                        distance: 10000,
                        createdAt: '',
                        updatedAt: '',
                        subDistances: [],
                    },
                ],
            },
        ],
    },
] as EventResource[];

const participantPage = {
    id: 'page-1',
    userId: profile.id,
    title: 'Klub Biegowy',
    link: 'klub-biegowy',
    participants: [{ id: 'page-participant-1', userId: profile.id }],
} as PageResource;

function renderSignups(link = profile.link) {
    return render(
        <Routes>
            <Route path="/users/:link/event-signups" element={<UserEventSignups />} />
        </Routes>,
        { initialEntries: [`/users/${link}/event-signups`] },
    );
}

describe('UserEventSignups', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockImplementation(async (request) => {
            const link = request.params?.query?.filter?.link;
            return { data: link === participantProfile.link ? [participantProfile] : [profile] } as never;
        });
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(eventService, 'getEventDisciplineDistanceLists').mockResolvedValue({
            data: signups,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(eventService, 'getEvents').mockResolvedValue({ data: events } as never);
        vi.spyOn(pageService, 'getPages').mockResolvedValue({ data: [participantPage] } as never);
        vi.spyOn(eventService, 'updateEventDisciplineDistanceListStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'deleteEventDisciplineDistanceList').mockResolvedValue({} as never);
    });

    it('shows loading and then maps signups to event, discipline and distance details', async () => {
        let resolveSignups!: (value: {
            data: EventDisciplineDistanceListResource[];
            pagination: { total: number };
        }) => void;
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSignups = resolve;
                }) as never,
        );
        renderSignups();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveSignups).toBeDefined());
        resolveSignups({ data: signups, pagination: { total: 2 } });

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.getByText('Rowerowy maraton')).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(screen.getByText('Jazda na rowerze')).toBeVisible();
        expect(screen.getByText('5km')).toBeVisible();
        expect(screen.getByText('10km')).toBeVisible();
        expect(screen.getByText('Zaakceptowany')).toBeVisible();
        expect(screen.getByText('Oczekujący')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(eventService.getEventDisciplineDistanceLists).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
        expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        limit: 100,
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances'],
                    }),
                }),
            }),
        );
    });

    it('filters signups by status and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockResolvedValue({
            data: signups.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderSignups();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        const statusFilter = await screen.findByRole('combobox', { name: 'Status' });
        await user.click(statusFilter);
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(eventService.getEventDisciplineDistanceLists).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, status: SaveStatusEnum.ACCEPTED },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(eventService.getEventDisciplineDistanceLists).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('lets the signup owner change signup status and withdraw the signup', async () => {
        const user = userEvent.setup();
        renderSignups();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Zmień status zapisu' })[0]);
        await waitFor(() => {
            expect(eventService.updateEventDisciplineDistanceListStatus).toHaveBeenCalledWith({
                params: { path: { id: 'signup-1' } },
                body: { status: SaveStatusEnum.ACCEPTED },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(eventService.deleteEventDisciplineDistanceList).toHaveBeenCalledWith({
                params: { path: { id: 'signup-1' } },
            });
        });
    });

    it('lets the event owner moderate signups but not withdraw another user’s signup', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'event-owner-1', link: 'owner' };
        vi.mocked(userService.getUsers).mockImplementation(async (request) => {
            const link = request.params?.query?.filter?.link;
            return { data: link === profile.link ? [profile] : [{ ...profile, id: 'event-owner-1' }] } as never;
        });
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: [
                {
                    ...participantPage,
                    userId: 'event-owner-1',
                    participants: [
                        { id: 'page-participant-1', userId: 'event-owner-1' },
                        { id: 'page-participant-2', userId: 'event-owner-1' },
                    ],
                },
            ],
        } as never);
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: profile.id,
                    receiverUserId: 'event-owner-1',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        renderSignups();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.getAllByRole('button', { name: 'Zmień status zapisu' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status zapisu' })[0]);
        await waitFor(() => {
            expect(eventService.updateEventDisciplineDistanceListStatus).toHaveBeenCalledWith({
                params: { path: { id: 'signup-1' } },
                body: { status: SaveStatusEnum.ACCEPTED },
            });
        });
    });

    it('hides status and delete controls for a user who is neither signup nor event owner', async () => {
        mocks.currentUser = { id: 'other-participant', link: 'jan-runner' };
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [profile] } as never);
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: profile.id,
                    receiverUserId: 'other-participant',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockResolvedValue({
            data: signups,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [] } as never);
        renderSignups();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Zmień status zapisu' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('shows an empty state when the participant has no signups', async () => {
        vi.mocked(eventService.getEventDisciplineDistanceLists).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderSignups();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('denies access to a profile without the participant role', async () => {
        mocks.currentUser = { id: 'owner-1', link: 'owner' };
        vi.mocked(userService.getUsers).mockResolvedValue({
            data: [{ ...profile, roles: [{ id: 'role-2', role: RoleEnum.ORGANIZER }] }],
        } as never);
        renderSignups('owner');

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(eventService.getEventDisciplineDistanceLists).not.toHaveBeenCalled();
    });

    it('allows an accepted friend to view signups without access to owner actions', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend' };
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: profile.id,
                    receiverUserId: 'friend-1',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [] } as never);
        renderSignups();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Zmień status zapisu' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderSignups();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(eventService.getEventDisciplineDistanceLists).not.toHaveBeenCalled();
    });
});
