import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import {
    friendService,
    pageService,
    userService,
    type PageFollowResource,
    type PageResource,
    type UserResource,
} from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { PageFollowStatusEnum } from '../../enums/PageFollowStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserPageFollows from './UserPageFollows';
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
            <button onClick={() => onChange(PageFollowStatusEnum.ACCEPTED)}>Zmień status obserwowania</button>
        ),
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const pages = [
    {
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
    },
    {
        id: 'page-2',
        userId: 'owner-2',
        title: 'Rowerowe wyprawy',
        link: 'rowerowe-wyprawy',
        description: 'Wspólne wycieczki.',
        profilePhoto: '',
        backgroundPhoto: '',
        color: 2,
        status: 2,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
        follows: [],
        participants: [],
    },
] as PageResource[];

const follows = [
    {
        id: 'follow-1',
        pageId: 'page-1',
        userId: profile.id,
        status: PageFollowStatusEnum.ACCEPTED,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'follow-2',
        pageId: 'page-2',
        userId: profile.id,
        status: PageFollowStatusEnum.PENDING,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as PageFollowResource[];

function renderPageFollows() {
    return render(
        <Routes>
            <Route path="/users/:link/page-follows" element={<UserPageFollows />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/page-follows'] },
    );
}

describe('UserPageFollows', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(pageService, 'getPageFollows').mockResolvedValue({
            data: follows,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(pageService, 'getPage').mockImplementation(async (request) => {
            const page = pages.find((item) => item.id === request.params?.path?.id);
            return { data: page } as never;
        });
        vi.spyOn(pageService, 'updatePageFollowStatus').mockResolvedValue({} as never);
        vi.spyOn(pageService, 'deletePageFollow').mockResolvedValue({} as never);
    });

    it('shows loading before the followed pages and statuses load', async () => {
        let resolveFollows!: (value: { data: PageFollowResource[]; pagination: { total: number } }) => void;
        vi.mocked(pageService.getPageFollows).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveFollows = resolve;
                }) as never,
        );
        renderPageFollows();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveFollows).toBeDefined());
        resolveFollows({ data: follows, pagination: { total: 2 } });

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.getByText('Rowerowe wyprawy')).toBeVisible();
        expect(screen.getByText('Zaakceptowany')).toBeVisible();
        expect(screen.getByText('Oczekujący')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Zmień status obserwowania' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Przestań obserwować stronę' })).toHaveLength(2);
        expect(pageService.getPageFollows).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, pageIds: null, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('filters follows by status and paginates results', async () => {
        const user = userEvent.setup();
        vi.mocked(pageService.getPageFollows).mockResolvedValue({
            data: follows.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderPageFollows();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        const statusFilter = await screen.findByRole('combobox', { name: 'Status' });
        await user.click(statusFilter);
        await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

        await waitFor(() => {
            expect(pageService.getPageFollows).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: {
                                userId: profile.id,
                                pageIds: null,
                                status: PageFollowStatusEnum.ACCEPTED,
                            },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(pageService.getPageFollows).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('lets the owner update a follow status and unfollow the page', async () => {
        const user = userEvent.setup();
        renderPageFollows();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        await user.click(screen.getAllByRole('button', { name: 'Zmień status obserwowania' })[0]);
        await waitFor(() => {
            expect(pageService.updatePageFollowStatus).toHaveBeenCalledWith({
                params: { path: { id: 'follow-1' } },
                body: { status: PageFollowStatusEnum.ACCEPTED },
            });
        });

        await user.click(screen.getAllByRole('button', { name: 'Przestań obserwować stronę' })[0]);
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(pageService.deletePageFollow).toHaveBeenCalledWith({
                params: { path: { id: 'follow-1' } },
            });
        });
    });

    it('shows an empty state when the user follows no pages', async () => {
        vi.mocked(pageService.getPageFollows).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderPageFollows();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
    });

    it('allows an accepted friend to view follows but hides management actions', async () => {
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
        renderPageFollows();

        expect(await screen.findByText('Klub Biegowy')).toBeVisible();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Zmień status obserwowania' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Przestań obserwować stronę' })).not.toBeInTheDocument();
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        vi.mocked(friendService.getFriends).mockResolvedValue({ data: [] } as never);
        renderPageFollows();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(pageService.getPageFollows).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderPageFollows();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(pageService.getPageFollows).not.toHaveBeenCalled();
    });
});
