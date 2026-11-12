import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { friendService, storyService, userService, type StoryResource, type UserResource } from '../../api/services';
import type * as AuthModule from '../../auth';
import type * as ComponentsModule from '../../components';
import type * as UtilsModule from '../../utils';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';
import { RoleEnum } from '../../enums/RoleEnum';
import UserStories from './UserStories';
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
            <button onClick={() => onChange(3)}>Zmień status relacji</button>
        ),
        StoryModal: ({
            opened,
            story,
            onClose,
        }: {
            opened: boolean;
            story?: StoryResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={story ? 'Edycja relacji' : 'Nowa relacja'}>
                    <button onClick={onClose}>Zamknij formularz relacji</button>
                </section>
            ) : null,
        StoryViewerModal: ({
            opened,
            story,
            onClose,
        }: {
            opened: boolean;
            story?: StoryResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label="Podgląd relacji">
                    <p>{story?.text}</p>
                    <button onClick={onClose}>Zamknij podgląd relacji</button>
                </section>
            ) : null,
    };
});

const profile = {
    id: 'profile-1',
    link: 'ada-runner',
    firstName: 'Ada',
    lastName: 'Runner',
    roles: [{ id: 'role-1', role: RoleEnum.PARTICIPANT }],
} as UserResource;

const stories = [
    {
        id: 'story-1',
        userId: profile.id,
        text: 'Poranny trening',
        photo: '',
        status: 2,
        createdAt: '2026-11-10T09:00:00',
        updatedAt: '2026-11-10T09:00:00',
    },
    {
        id: 'story-2',
        userId: profile.id,
        text: 'Bieg w parku',
        photo: '',
        status: 1,
        createdAt: '2026-11-09T09:00:00',
        updatedAt: '2026-11-09T09:00:00',
    },
] as StoryResource[];

function renderStories() {
    return render(
        <Routes>
            <Route path="/users/:link/stories" element={<UserStories />} />
        </Routes>,
        { initialEntries: ['/users/ada-runner/stories'] },
    );
}

describe('UserStories', () => {
    beforeEach(() => {
        mocks.currentUser = { id: profile.id, link: profile.link };
        mocks.isAdmin = false;
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [profile] } as never);
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);
        vi.spyOn(storyService, 'getStories').mockResolvedValue({
            data: stories,
            pagination: { page: 1, total: 2, hasNextPage: false },
        } as never);
        vi.spyOn(storyService, 'updateStoryStatus').mockResolvedValue({} as never);
        vi.spyOn(storyService, 'deleteStory').mockResolvedValue({} as never);
    });

    it('shows loading and then the profile owner’s stories with management actions', async () => {
        let resolveStories!: (value: { data: StoryResource[]; pagination: { total: number } }) => void;
        vi.mocked(storyService.getStories).mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveStories = resolve;
                }) as never,
        );
        renderStories();

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await waitFor(() => expect(resolveStories).toBeDefined());
        resolveStories({ data: stories, pagination: { total: 2 } });

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.getByText('Bieg w parku')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj relację' })).toBeVisible();
        expect(screen.getAllByRole('button', { name: 'Edytuj' })).toHaveLength(2);
        expect(screen.getAllByRole('button', { name: 'Usuń' })).toHaveLength(2);
        expect(storyService.getStories).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({
                        page: 1,
                        limit: 10,
                        filter: { userId: profile.id, text: null, status: null },
                        sort: 'createdAt:desc',
                    }),
                }),
            }),
        );
    });

    it('allows the owner to create, edit and view a story', async () => {
        const user = userEvent.setup();
        renderStories();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj relację' }));
        expect(screen.getByRole('dialog', { name: 'Nowa relacja' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz relacji' }));

        await user.click(screen.getAllByRole('button', { name: 'Edytuj' })[0]);
        expect(screen.getByRole('dialog', { name: 'Edycja relacji' })).toBeVisible();

        await user.click(screen.getAllByRole('button', { name: 'Szczegóły' })[0]);
        expect(screen.getByRole('dialog', { name: 'Podgląd relacji' })).toHaveTextContent('Poranny trening');
        await user.click(screen.getByRole('button', { name: 'Zamknij podgląd relacji' }));
        expect(screen.queryByRole('dialog', { name: 'Podgląd relacji' })).not.toBeInTheDocument();
    });

    it('filters stories by text, sorts and changes page', async () => {
        const user = userEvent.setup();
        vi.mocked(storyService.getStories).mockResolvedValue({
            data: stories.slice(0, 1),
            pagination: { page: 1, total: 25, hasNextPage: true },
        } as never);
        renderStories();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText('Treść'), ' poranny ');

        await waitFor(() => {
            expect(storyService.getStories).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: { userId: profile.id, text: 'poranny', status: null },
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Tekst: A do Z'));
        await waitFor(() => {
            expect(storyService.getStories).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'text:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(storyService.getStories).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('shows an empty state when the profile has no stories', async () => {
        vi.mocked(storyService.getStories).mockResolvedValue({
            data: [],
            pagination: { page: 1, total: 0 },
        } as never);
        renderStories();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj relację' })).toBeVisible();
    });

    it('allows an administrator to change story status but not edit or delete it', async () => {
        const user = userEvent.setup();
        mocks.currentUser = { id: 'admin-1', link: 'admin' };
        mocks.isAdmin = true;
        renderStories();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj relację' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();

        await user.click(screen.getAllByRole('button', { name: 'Zmień status relacji' })[0]);
        await waitFor(() => {
            expect(storyService.updateStoryStatus).toHaveBeenCalledWith({
                params: { path: { id: 'story-1' } },
                body: { status: 3 },
            });
        });
    });

    it('allows an accepted friend to view stories without management actions', async () => {
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
        renderStories();

        expect(await screen.findByText('Poranny trening')).toBeVisible();
        expect(screen.getAllByRole('button', { name: 'Szczegóły' })).toHaveLength(2);
        expect(screen.queryByRole('button', { name: 'Dodaj relację' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
    });

    it('denies access to a visitor who is not the owner, an administrator or a friend', async () => {
        mocks.currentUser = { id: 'visitor-1', link: 'visitor' };
        renderStories();

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(storyService.getStories).not.toHaveBeenCalled();
    });

    it('shows not found when the profile does not exist', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);
        renderStories();

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(storyService.getStories).not.toHaveBeenCalled();
    });
});
