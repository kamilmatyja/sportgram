import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { eventService, pageService, type EventResource, type PageResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import EventsList from './EventsList';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isOrganizer: false,
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isOrganizer: mocks.isOrganizer,
            isAdmin: mocks.isAdmin,
        }),
    };
});

vi.mock('../../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return { ...hooks, useMyFriends: () => ({ collaboratorOptions: [], friends: [], isLoading: false }) };
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
            <button onClick={() => onStatusChange(ElementStatusEnum.ACTIVE)}>Zmień status wydarzenia</button>
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
                    <p>{event?.title ?? 'Nowe wydarzenie'}</p>
                    <p>{pageOptions.map((option) => option.label).join(', ')}</p>
                    <button onClick={onClose}>Zamknij formularz wydarzenia</button>
                </section>
            ) : null,
    };
});

const ownerId = 'organizer-1';
const ownPage = {
    id: 'page-1',
    userId: ownerId,
    title: 'Klub Biegowy',
    link: 'klub-biegowy',
    participants: [{ id: 'page-participant-1', userId: ownerId }],
} as PageResource;
const pageOwnedByOthers = {
    id: 'page-2',
    userId: 'other-owner',
    title: 'Klub Rowerowy',
    link: 'klub-rowerowy',
    participants: [{ id: 'page-participant-2', userId: 'other-owner' }],
} as PageResource;
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
        status: ElementStatusEnum.ACTIVE,
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
        status: ElementStatusEnum.DRAFT,
        startedAt: '2026-11-09T09:00:00',
        endedAt: '2026-11-09T14:00:00',
        createdAt: '2026-10-09T09:00:00',
        updatedAt: '2026-10-09T09:00:00',
        disciplines: [],
    },
] as EventResource[];

function renderEvents() {
    return render(
        <Routes>
            <Route path="/events" element={<EventsList />} />
        </Routes>,
        { initialEntries: ['/events'] },
    );
}

describe('EventsList', () => {
    beforeEach(() => {
        mocks.currentUser = { id: ownerId, link: 'ada' };
        mocks.isOrganizer = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(pageService, 'getPages').mockResolvedValue({
            data: [ownPage, pageOwnedByOthers],
        } as never);
        vi.spyOn(eventService, 'getEvents').mockResolvedValue({
            data: events,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(eventService, 'updateEventStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'deleteEvent').mockResolvedValue({} as never);
    });

    it('shows loading and then lists events and management actions for owned events', async () => {
        let resolveEvents!: (value: { data: EventResource[]; pagination: { total: number } }) => void;
        vi.mocked(eventService.getEvents).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveEvents = resolve;
                }) as never,
        );
        renderEvents();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveEvents).toBeDefined());
        resolveEvents({ data: events, pagination: { total: 2 } });

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.getByText('Rowerowy maraton')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Zmień status wydarzenia' })).toHaveLength(1);
        expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { title: null, link: null, status: null },
                        sort: 'startedAt:desc',
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
                    }),
                }),
            }),
        );
        expect(pageService.getPages).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: {
                        filter: { userId: ownerId },
                        limit: 50,
                        'include[]': ['pageParticipants'],
                    },
                }),
            }),
        );
    });

    it('filters by title, link and status, sorts and paginates events', async () => {
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
        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(eventService.getEvents).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { title: 'Bieg', link: 'bieg-miejski', status: ElementStatusEnum.DRAFT },
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
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'title:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(eventService.getEvents).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets an event owner create, edit, change status and delete events', async () => {
        const user = userEvent.setup();
        renderEvents();
        expect(await screen.findByText('Bieg miejski')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Dodaj wydarzenie' }));
        expect(screen.getByRole('dialog', { name: 'Nowe wydarzenie' })).toHaveTextContent(
            'Klub Biegowy (@klub-biegowy)',
        );
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz wydarzenia' }));

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja wydarzenia' })).toHaveTextContent('Bieg miejski');
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz wydarzenia' }));

        await user.click(screen.getByRole('button', { name: 'Zmień status wydarzenia' }));
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(eventService.deleteEvent).toHaveBeenCalledWith({ params: { path: { id: 'event-1' } } });
        });
    });

    it('shows a notification instead of opening the create form when the organizer has no pages', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [] } as never);
        renderEvents();

        await user.click(await screen.findByRole('button', { name: 'Dodaj wydarzenie' }));
        expect(await screen.findByText('Musisz najpierw utworzyć stronę, aby móc dodać wydarzenie.')).toBeVisible();
        expect(screen.queryByRole('dialog', { name: 'Nowe wydarzenie' })).not.toBeInTheDocument();
    });

    it('does not allow administrators to create events but lets them moderate events', async () => {
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isOrganizer = false;
        mocks.isAdmin = true;
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj wydarzenie' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await userEvent.click(screen.getAllByRole('button', { name: 'Zmień status wydarzenia' })[0]);
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });
    });

    it('hides event mutations from a regular user', async () => {
        mocks.currentUser = { id: 'regular-user', link: 'regular' };
        mocks.isOrganizer = false;
        renderEvents();

        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj wydarzenie' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status wydarzenia' })).not.toBeInTheDocument();
    });

    it('shows an empty state for an empty event list', async () => {
        vi.mocked(eventService.getEvents).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderEvents();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wydarzenie' })).toBeVisible();
    });
});
