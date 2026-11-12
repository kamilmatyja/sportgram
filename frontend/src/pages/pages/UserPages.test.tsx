import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { friendService, pageService, userService, type PageResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserPages from './UserPages';
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
        useMyFriends: () => ({ collaboratorOptions: [], friends: [], isLoading: false }),
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
            <button onClick={() => onStatusChange(3)}>Zmień status strony</button>
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
                <section role="dialog" aria-label={page ? 'Edycja strony' : 'Nowa strona'}>
                    <p>{page?.title}</p>
                    <button onClick={onClose}>Zamknij formularz strony</button>
                </section>
            ) : null,
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-organizer',
    firstName: 'Ada',
    lastName: 'Organizer',
    roles: [{ id: 'role-1', role: RoleEnum.ORGANIZER }],
} as UserResource;

const nonOrganizerProfile = {
    ...profile,
    id: 'participant-1',
    link: 'ada-runner',
    roles: [{ id: 'role-2', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const pages = [
    {
        id: 'page-1',
        userId: profile.id,
        title: 'Klub Biegowy',
        link: 'klub-biegowy',
        description: 'Biegamy razem.',
        profilePhoto: '',
        backgroundPhoto: '',
        color: 1,
        status: 2,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
        follows: [],
        participants: [],
    },
    {
        id: 'page-2',
        userId: profile.id,
        title: 'Rowerowe wyprawy',
        link: 'rowerowe-wyprawy',
        description: 'Wspólne wycieczki.',
        profilePhoto: '',
        backgroundPhoto: '',
        color: 2,
        status: 1,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
        follows: [],
        participants: [],
    },
] as PageResource[];

function renderPages() {
    return render(
        <Routes>
            <Route path="/users/:link/pages" element={<UserPages />} />
        </Routes>,
        { initialEntries: ['/users/ada-organizer/pages'] },
    );
}

describe('UserPages', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockImplementation(async (request) => {
            const link = request.params?.query?.filter?.link;
            return { data: link === nonOrganizerProfile.link ? [nonOrganizerProfile] : [profile] } as never;
        });
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(pageService, 'getPages').mockResolvedValue({
            data: pages,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(pageService, 'updatePageStatus').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'deletePage').mockResolvedValue({} as never);
    });

    it('shows loading and then the organizer’s pages and management actions', async () => {
        let resolvePages!: (value: { data: PageResource[]; pagination: { total: number } }) => void;
        vi.mocked(pageService.getPages).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePages = resolve;
                }) as never,
        );
        renderPages();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolvePages).toBeDefined());
        resolvePages({ data: pages, pagination: { total: 2 } });

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.getByText('Rowerowe wyprawy')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(screen.getByRole('button', { name: 'Dodaj stronę' })).toBeVisible();
        expect(pageService.getPages).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, title: null, link: null, status: null },
                        sort: 'createdAt:desc',
                        'include[]': ['pageParticipants'],
                    }),
                }),
            }),
        );
    });

    it('filters pages by title and link, sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: pages.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Tytuł'), ' Klub ');
        await user.type(screen.getByLabelText('Link'), ' klub-biegowy ');

        await waitFor(() => {
            expect(pageService.getPages).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: {
                                userId: profile.id,
                                title: 'Klub',
                                link: 'klub-biegowy',
                                status: null,
                            },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tytuł: A do Z'));
        await waitFor(() => {
            expect(pageService.getPages).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'title:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(pageService.getPages).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('lets the owner create, edit and delete pages', async () => {
        const user = userEvent.setup();
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj stronę' }));
        expect(screen.getByRole('dialog', { name: 'Nowa strona' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz strony' }));

        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        expect(screen.getByRole('dialog', { name: 'Edycja strony' })).toHaveTextContent('Klub Biegowy');

        await user.click(screen.getAllByRole('button', { name: 'Usuń' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(pageService.deletePage).toHaveBeenCalledWith({ params: { path: { id: 'page-1' } } });
        });
    });

    it('allows the owner to change a page status', async () => {
        const user = userEvent.setup();
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Zmień status strony' })[0]);
        await waitFor(() => {
            expect(pageService.updatePageStatus).toHaveBeenCalledWith({
                params: { path: { id: 'page-1' } },
                body: { status: 3 },
            });
        });
    });

    it('shows an empty state when the organizer has no pages', async () => {
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderPages();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj stronę' })).toBeVisible();
    });

    it('allows an administrator to moderate pages but hides owner-only actions', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj stronę' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status strony' })[0]);
        await waitFor(() => {
            expect(pageService.updatePageStatus).toHaveBeenCalledWith({
                params: { path: { id: 'page-1' } },
                body: { status: 3 },
            });
        });
    });

    it('denies access to a non-organizer even when they own the profile', async () => {
        mocks.currentUser = { id: nonOrganizerProfile.id, link: nonOrganizerProfile.link };
        render(
            <Routes>
                <Route path="/users/:link/pages" element={<UserPages />} />
            </Routes>,
            { initialEntries: ['/users/ada-runner/pages'] },
        );

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(pageService.getPages).not.toHaveBeenCalled();
    });

    it('denies access to a friend whose profile does not have the organizer role', async () => {
        mocks.currentUser = { id: 'friend-1', link: 'friend' };
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [nonOrganizerProfile] } as never);
        vi.mocked(friendService.getFriends).mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: nonOrganizerProfile.id,
                    receiverUserId: 'friend-1',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);
        render(
            <Routes>
                <Route path="/users/:link/pages" element={<UserPages />} />
            </Routes>,
            { initialEntries: ['/users/ada-runner/pages'] },
        );

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(pageService.getPages).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderPages();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(pageService.getPages).not.toHaveBeenCalled();
    });
});
