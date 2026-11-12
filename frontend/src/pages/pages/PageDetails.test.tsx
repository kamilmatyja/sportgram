import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    eventService,
    pageService,
    type EventResource,
    type PageFollowResource,
    type PageParticipantResource,
    type PageResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import PageDetails from './PageDetails';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { id: string; link: string },
    isOrganizer: false,
    isAdmin: false,
    getUser: vi.fn((id: string) => ({
        id,
        link: 'ada-runner',
        firstName: 'Ada',
        lastName: 'Runner',
    })),
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
    return {
        ...hooks,
        useMyFriends: () => ({ collaboratorOptions: [], friends: [], isLoading: false }),
        useUsersMap: () => ({ getUser: mocks.getUser, usersMap: {}, isLoading: false }),
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
        PageNav: ({ page, extraActions }: { page: PageResource; extraActions: React.ReactNode }) => (
            <header>
                <h1>{page.title}</h1>
                {extraActions}
            </header>
        ),
        StatusActionMenu: ({ onStatusChange }: { onStatusChange: (status: number) => void }) => (
            <button onClick={() => onStatusChange(ElementStatusEnum.ACTIVE)}>Zmień status</button>
        ),
        UserInfoCell: ({ user }: { user?: { firstName?: string; lastName?: string } }) => (
            <span>{user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'}</span>
        ),
        PageFormModal: ({
            opened,
            page,
            onClose,
        }: {
            opened: boolean;
            page?: PageResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Edycja strony">
                    <p>{page?.title}</p>
                    <button onClick={onClose}>Zamknij edycję strony</button>
                </section>
            ) : null,
        EventFormModal: ({
            opened,
            defaultPageParticipantId,
            onClose,
        }: {
            opened: boolean;
            defaultPageParticipantId: string;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Nowe wydarzenie">
                    <p>{defaultPageParticipantId}</p>
                    <button onClick={onClose}>Zamknij tworzenie wydarzenia</button>
                </section>
            ) : null,
    };
});

const currentUserId = 'user-1';
const participant = {
    id: 'participant-1',
    pageId: 'page-1',
    userId: currentUserId,
    status: ElementStatusEnum.ACTIVE,
} as PageParticipantResource;

const page = {
    id: 'page-1',
    userId: 'user-1',
    title: 'Klub Biegowy',
    link: 'klub-biegowy',
    description: 'Biegamy razem.',
    profilePhoto: '',
    backgroundPhoto: '',
    color: 1,
    status: ElementStatusEnum.ACTIVE,
    createdAt: '2026-11-10T09:00:00',
    updatedAt: '2026-11-10T09:00:00',
    follows: [],
    participants: [participant],
} as PageResource;

const visitorPage = { ...page, userId: 'page-owner', participants: [] } as PageResource;
const event = {
    id: 'event-1',
    pageParticipantId: 'page-1',
    title: 'Bieg miejski',
    link: 'bieg-miejski',
    location: 'Warszawa',
    startedAt: '2026-11-10T09:00:00',
    endedAt: '2026-11-10T12:00:00',
    status: ElementStatusEnum.ACTIVE,
    photo: '',
} as EventResource;
const follow = {
    id: 'follow-1',
    pageId: 'page-1',
    userId: currentUserId,
    status: PageFollowStatusEnum.ACCEPTED,
    createdAt: '2026-11-10T09:00:00',
    updatedAt: '2026-11-10T09:00:00',
} as PageFollowResource;

function renderPage(link = page.link) {
    return render(
        <Routes>
            <Route path="/pages/:link" element={<PageDetails />} />
            <Route path="/pages" element={<div>Lista stron</div>} />
        </Routes>,
        { initialEntries: [`/pages/${link}`] },
    );
}

describe('PageDetails', () => {
    beforeEach(() => {
        mocks.currentUser = { id: currentUserId, link: 'ada' };
        mocks.isOrganizer = true;
        mocks.isAdmin = false;
        mocks.getUser.mockClear();
        mocks.confirmDelete.mockClear();
        vi.spyOn(pageService, 'getPages').mockResolvedValue({ data: [page] } as never);
        vi.spyOn(pageService, 'getPageFollows').mockResolvedValue({ data: [] } as never);
        vi.spyOn(pageService, 'createPageFollow').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'deletePageFollow').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'updatePageStatus').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'deletePage').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'updatePageParticipantStatus').mockResolvedValue({} as never);
        vi.spyOn(eventService, 'getEvents').mockResolvedValue({ data: [event] } as never);
    });

    it('shows loading and then the page, participants, events and default query', async () => {
        let resolvePage!: (value: { data: PageResource[] }) => void;
        vi.mocked(pageService.getPages).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePage = resolve;
                }) as never,
        );
        renderPage();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolvePage).toBeDefined());
        resolvePage({ data: [page] });

        expect(await screen.findByRole('heading', { name: 'Klub Biegowy' })).toBeVisible();
        expect(screen.getByText('Biegamy razem.')).toBeVisible();
        expect(screen.getByText('Ada Runner')).toBeVisible();
        expect(await screen.findByText('Bieg miejski')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj wydarzenie' })).toBeVisible();
        expect(pageService.getPages).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: {
                        filter: { link: 'klub-biegowy' },
                        limit: 1,
                        'include[]': ['pageParticipants', 'pageFollows'],
                    },
                }),
            }),
        );
        expect(eventService.getEvents).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: { filter: { pageId: 'page-1' }, limit: 50 },
                }),
            }),
        );
    });

    it('lets a signed-in visitor follow and unfollow the page', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [visitorPage] } as never);
        renderPage();

        expect(await screen.findByRole('button', { name: 'Zaobserwuj stronę' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zaobserwuj stronę' }));
        await waitFor(() => {
            expect(pageService.createPageFollow).toHaveBeenCalledWith({
                params: { path: { id: 'page-1' } },
                body: { status: PageFollowStatusEnum.ACCEPTED },
            });
        });

        vi.mocked(pageService.getPageFollows).mockResolvedValue({ data: [follow] } as never);
    });

    it('shows the unfollow control for existing followers and deletes their follow', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [visitorPage] } as never);
        vi.mocked(pageService.getPageFollows).mockResolvedValue({ data: [follow] } as never);
        renderPage();

        await user.click(await screen.findByRole('button', { name: 'Przestań obserwować stronę' }));
        await waitFor(() => {
            expect(pageService.deletePageFollow).toHaveBeenCalledWith({
                params: { path: { id: 'follow-1' } },
            });
        });
    });

    it('lets the owner edit/delete the page and update own participant status', async () => {
        const user = userEvent.setup();
        renderPage();
        expect(await screen.findByRole('heading', { name: 'Klub Biegowy' })).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja strony' })).toHaveTextContent('Klub Biegowy');
        await user.click(screen.getByRole('button', { name: 'Zamknij edycję strony' }));

        await user.click(screen.getAllByRole('button', { name: 'Zmień status' })[1]);
        await waitFor(() => {
            expect(pageService.updatePageParticipantStatus).toHaveBeenCalledWith({
                params: { path: { id: 'participant-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(pageService.deletePage).toHaveBeenCalledWith({ params: { path: { id: 'page-1' } } });
        });
    });

    it('allows administrators to change status but hides owner and organizer actions', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isOrganizer = false;
        mocks.isAdmin = true;
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [visitorPage] } as never);
        renderPage();

        expect(await screen.findByRole('heading', { name: 'Klub Biegowy' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Dodaj wydarzenie' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Zmień status' }));
        await waitFor(() => {
            expect(pageService.updatePageStatus).toHaveBeenCalledWith({
                params: { path: { id: 'page-1' } },
                body: { status: ElementStatusEnum.ACTIVE },
            });
        });
    });

    it('shows empty states and not found when the page does not exist', async () => {
        vi.mocked(eventService.getEvents).mockResolvedValue({ data: [] } as never);
        vi.mocked(pageService.getPages).mockResolvedValue({ data: [{ ...page, participants: [] }] } as never);
        renderPage();
        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();

        vi.mocked(pageService.getPages).mockResolvedValue({ data: [] } as never);
        renderPage();
        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(eventService.getEvents).toHaveBeenCalledTimes(1);
    });
});
