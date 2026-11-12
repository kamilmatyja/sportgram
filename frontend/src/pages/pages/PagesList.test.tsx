import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { pageService, type PageResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as HooksModule from '../../hooks';
import type * as UtilsModule from '../../utils';
import { RoleEnum } from '../../enums/RoleEnum';
import PagesList from './PagesList';
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

const owner = {
    id: 'organizer-1',
    link: 'ada-organizer',
    roles: [{ id: 'role-1', role: RoleEnum.ORGANIZER }],
} as UserResource;

const otherPage = {
    id: 'page-1',
    userId: 'owner-1',
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
} as PageResource;

const ownPage = { ...otherPage, id: 'page-2', userId: owner.id, title: 'Własny klub', link: 'wlasny-klub' };
const pages = [otherPage, ownPage] as PageResource[];

function renderPages() {
    return render(
        <Routes>
            <Route path="/pages" element={<PagesList />} />
        </Routes>,
        { initialEntries: ['/pages'] },
    );
}

describe('PagesList', () => {
    beforeEach(() => {
        mocks.currentUser = { id: owner.id, link: owner.link };
        mocks.isOrganizer = true;
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(pageService, 'getPages').mockResolvedValue({
            data: pages,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(pageService, 'updatePageStatus').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'deletePage').mockResolvedValue({} as never);
    });

    it('shows loading and then lists pages with the expected query and actions', async () => {
        let resolvePages!: (value: { data: PageResource[]; pagination: { total: number } }) => void;
        vi.mocked(pageService.getPages).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolvePages = resolve;
                }) as never,
        );
        renderPages();

        expect(document.querySelector('.mantine-Skeleton-root')).toBeInTheDocument();
        await waitFor(() => expect(resolvePages).toBeDefined());
        resolvePages({ data: pages, pagination: { total: 2 } });

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.getByText('Własny klub')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(1);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'Dodaj stronę' })).toBeVisible();
        expect(pageService.getPages).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { title: null, link: null, status: null },
                        sort: 'createdAt:desc',
                        'include[]': ['pageParticipants'],
                    }),
                }),
            }),
        );
    });

    it('filters by title, link and status, sorts and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: pages,
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Tytuł'), ' Klub ');
        await user.type(screen.getByLabelText('Link'), ' klub-biegowy ');
        await user.click(screen.getByRole('combobox', { name: 'Status' }));
        await user.keyboard('{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(pageService.getPages).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { title: 'Klub', link: 'klub-biegowy', status: 1 },
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
                    params: expect.objectContaining({ query: expect.objectContaining({ sort: 'title:asc' }) }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(pageService.getPages).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }),
                }),
            );
        });
    });

    it('lets a page owner edit, delete and change status, and an organizer create pages', async () => {
        const user = userEvent.setup();
        renderPages();
        expect(await screen.findByText('Własny klub')).toBeVisible();

        await user.click(screen.getByRole('button', { name: 'Dodaj stronę' }));
        expect(screen.getByRole('dialog', { name: 'Nowa strona' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz strony' }));

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja strony' })).toHaveTextContent('Własny klub');
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz strony' }));

        await user.click(screen.getByRole('button', { name: 'Zmień status strony' }));
        await waitFor(() => {
            expect(pageService.updatePageStatus).toHaveBeenCalledWith({
                params: { path: { id: 'page-2' } },
                body: { status: 3 },
            });
        });

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(pageService.deletePage).toHaveBeenCalledWith({ params: { path: { id: 'page-2' } } });
        });
    });

    it('does not offer page creation or owner actions to a regular user', async () => {
        mocks.isOrganizer = false;
        mocks.currentUser = { id: 'regular-user', link: 'regular' };
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj stronę' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Zmień status strony' })).not.toBeInTheDocument();
    });

    it('allows administrators to create pages and moderate page status but not edit or delete other pages', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isOrganizer = false;
        mocks.isAdmin = true;
        renderPages();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj stronę' })).toBeVisible();
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

    it('shows an empty state and allows organizers to create a page', async () => {
        vi.mocked(pageService.getPages).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderPages();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj stronę' })).toBeVisible();
    });
});
