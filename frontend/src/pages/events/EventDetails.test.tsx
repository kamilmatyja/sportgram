import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { eventService, pageService, type EventResource, type PageResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import EventDetails from './EventDetails';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isParticipant: false,
    isAdmin: false,
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isParticipant: mocks.isParticipant,
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
        PageNav: ({ page }: { page: PageResource }) => (
            <header>
                <h1>{page.title}</h1>
            </header>
        ),
        EntityViewCounter: () => <span>Wyświetlenia: 12</span>,
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: number) => void }) => (
            <button onClick={() => onStatusChange(ElementStatusEnum.ACTIVE)}>Zmień status wydarzenia</button>
        ),
        EventFormModal: ({
            opened,
            event,
            onClose,
        }: {
            opened: boolean;
            event?: EventResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Edycja wydarzenia">
                    <p>{event?.title}</p>
                    <button onClick={onClose}>Zamknij edycję wydarzenia</button>
                </section>
            ) : null,
    };
});

const currentUserId = 'organizer-1';
const ownPage = {
    id: 'page-1',
    userId: currentUserId,
    title: 'Klub Biegowy',
    link: 'klub-biegowy',
    color: 1,
    participants: [{ id: 'page-participant-1', userId: currentUserId, status: ElementStatusEnum.ACTIVE }],
} as unknown as PageResource;
const event = {
    id: 'event-1',
    pageParticipantId: 'page-participant-1',
    title: 'Bieg miejski',
    description: 'Bieg uliczny w centrum.',
    link: 'bieg-miejski',
    location: 'Warszawa',
    rules: 'Obowiązuje regulamin zawodów.',
    photo: '',
    status: ElementStatusEnum.DRAFT,
    startedAt: '2026-11-10T09:00:00',
    endedAt: '2026-11-10T12:00:00',
    disciplines: [
        {
            id: 'discipline-1',
            eventId: 'event-1',
            discipline: 1,
            distances: [
                {
                    id: 'distance-1',
                    eventDisciplineId: 'discipline-1',
                    distance: 5000,
                    subDistances: [],
                },
            ],
        },
    ],
} as EventResource;

function renderEvent(link = event.link) {
    return render(
        <Routes>
            <Route path="/events/:link" element={<EventDetails />} />
            <Route path="/events" element={<div>Lista wydarzeń</div>} />
        </Routes>,
        { initialEntries: [`/events/${link}`] },
    );
}

describe('EventDetails', () => {
    beforeEach(() => {
        mocks.currentUser = { id: currentUserId, link: 'ada' };
        mocks.isParticipant = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(eventService, 'getEvents').mockResolvedValue({ data: [event] } as never);
        vi.spyOn(eventService, 'createEventDisciplineDistanceList').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'getEventDisciplineDistanceLists').mockResolvedValue({ data: [] } as never);
        vi.spyOn(eventService, 'updateEventStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'deleteEvent').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'getPages').mockResolvedValue({ data: [ownPage] } as never);
    });

    it('shows loading and then event details, rules, distances and the owning page', async () => {
        let resolveEvents!: (value: { data: EventResource[] }) => void;
        vi.mocked(eventService.getEvents).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveEvents = resolve;
                }) as never,
        );
        renderEvent();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveEvents).toBeDefined());
        resolveEvents({ data: [event] });

        expect(await screen.findByRole('heading', { name: 'Bieg miejski' })).toBeVisible();
        expect(screen.getByText('Bieg uliczny w centrum.')).toBeVisible();
        expect(screen.getByText('Obowiązuje regulamin zawodów.')).toBeVisible();
        expect(screen.getByText('Warszawa')).toBeVisible();
        expect(screen.getByText('Bieganie')).toBeVisible();
        expect(await screen.findByRole('heading', { name: 'Klub Biegowy' })).toBeVisible();
        expect(screen.getByText('Wyświetlenia: 12')).toBeVisible();
        expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: {
                        filter: { link: 'bieg-miejski' },
                        limit: 1,
                        'include[]': ['eventDisciplines', 'eventDisciplineDistances', 'eventDisciplineSubDistances'],
                    },
                }),
            }),
        );
    });

    it('lets an eligible participant sign up for an event distance', async () => {
        const user = userEvent.setup();
        mocks.isParticipant = true;
        renderEvent();

        await user.click(await screen.findByRole('button', { name: 'Zapisz się' }));
        await waitFor(() => {
            expect(eventService.createEventDisciplineDistanceList).toHaveBeenCalledWith({
                params: { path: { id: 'distance-1' } },
            });
        });
    });

    it('lets the event owner edit, delete and update status', async () => {
        const user = userEvent.setup();
        renderEvent();
        expect(await screen.findByRole('heading', { name: 'Bieg miejski' })).toBeVisible();

        await user.click(await screen.findByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja wydarzenia' })).toHaveTextContent('Bieg miejski');
        await user.click(screen.getByRole('button', { name: 'Zamknij edycję wydarzenia' }));

        await user.click(await screen.findByRole('button', { name: 'Zmień status wydarzenia' }));
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });

        await user.click(await screen.findByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(eventService.deleteEvent).toHaveBeenCalledWith({ params: { path: { id: 'event-1' } } });
        });
    });

    it('allows administrators to moderate status but hides owner edit and delete controls', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isParticipant = false;
        mocks.isAdmin = true;
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: [{ ...ownPage, userId: 'owner-1', participants: [] }],
        } as never);
        renderEvent();

        expect(await screen.findByRole('heading', { name: 'Bieg miejski' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(await screen.findByRole('button', { name: 'Zmień status wydarzenia' }));
        await waitFor(() => {
            expect(eventService.updateEventStatus).toHaveBeenCalledWith({
                params: { path: { id: 'event-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });
    });

    it('hides management actions and signup controls when viewer has no relevant role', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        mocks.isParticipant = false;
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: [{ ...ownPage, userId: 'owner-1', participants: [] }],
        } as never);
        renderEvent();

        expect(await screen.findByRole('heading', { name: 'Bieg miejski' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Zmień status wydarzenia' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zapisz się' })).not.toBeInTheDocument();
    });

    it('shows empty states and not found when the event is missing', async () => {
        vi.mocked(eventService.getEvents).mockResolvedValue({
            data: [{ ...event, disciplines: [] }],
        } as never);
        renderEvent();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();

        vi.mocked(eventService.getEvents).mockResolvedValue({ data: [] } as never);
        renderEvent();
        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(pageService.getPages).toHaveBeenCalledOnce();
    });
});
