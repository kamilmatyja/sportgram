import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import { userService } from '../../api/services';
import type * as ComponentsModule from '../../components';
import type * as AuthModule from '../../auth';
import type * as UtilsModule from '../../utils';
import type { UserResource } from '../../api/services';
import UsersList from './UsersList';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

const mocks = vi.hoisted(() => ({
    currentUser: { id: 'user-1', link: 'ada' },
    isAdmin: false,
    logout: vi.fn(),
    confirmDelete: vi.fn((_t: (key: string) => string, onConfirm: () => void) => onConfirm()),
}));

vi.mock('../../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return {
        ...auth,
        useAuth: () => ({
            currentUser: mocks.currentUser,
            isAdmin: mocks.isAdmin,
            logout: mocks.logout,
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
        StatusActionMenu: ({ value, onChange }: { value: number; onChange: (status: number) => void }) => (
            <button aria-label={`Zmień status: ${value}`} onClick={() => onChange(3)}>
                Ustaw status zbanowany
            </button>
        ),
        UserFormModal: ({
            opened,
            user,
            onClose,
        }: {
            opened: boolean;
            user?: UserResource | null;
            onClose: () => void;
        }) =>
            opened ? (
                <section role="dialog" aria-label={user ? 'Edycja użytkownika' : 'Nowy użytkownik'}>
                    <p>{user?.firstName ?? 'Formularz nowego użytkownika'}</p>
                    <button onClick={onClose}>Zamknij formularz</button>
                </section>
            ) : null,
    };
});

const users = [
    {
        id: 'user-1',
        firstName: 'Ada',
        lastName: 'Runner',
        email: 'ada@example.com',
        link: 'ada',
        status: 2,
        createdAt: '2026-10-10 08:00:00',
    },
    {
        id: 'user-2',
        firstName: 'Jan',
        lastName: 'Biegacz',
        email: 'jan@example.com',
        link: 'jan',
        status: 1,
        createdAt: '2026-10-11 08:00:00',
    },
] as UserResource[];

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

function renderUsersList() {
    return render(
        <>
            <UsersList />
            <LocationPath />
        </>,
        { initialEntries: ['/users'] },
    );
}

describe('UsersList', () => {
    beforeEach(() => {
        mocks.currentUser = { id: 'user-1', link: 'ada' };
        mocks.isAdmin = false;
        mocks.logout.mockReset();
        mocks.confirmDelete.mockClear();
        vi.spyOn(userService, 'getUsers').mockResolvedValue({
            data: users,
            pagination: { total: 25 },
        } as never);
        vi.spyOn(userService, 'updateUserStatus').mockResolvedValue({} as never);
        vi.spyOn(userService, 'deleteUser').mockResolvedValue({} as never);
    });

    it('shows users, filters, sorting and paginated results', async () => {
        const user = userEvent.setup();
        renderUsersList();

        expect(await screen.findByText('Ada Runner')).toBeVisible();
        expect(screen.getByText('jan@example.com')).toBeVisible();
        expect(screen.getByText('Razem: 25')).toBeVisible();
        expect(userService.getUsers).toHaveBeenCalledWith(
            expect.objectContaining({
                params: expect.objectContaining({
                    query: expect.objectContaining({ page: 1, limit: 10, sort: 'createdAt:desc' }),
                }),
            }),
        );

        await user.click(screen.getByRole('button', { name: /Filtry/ }));
        await user.type(screen.getByLabelText(/Imię/), ' Ada ');
        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({
                            page: 1,
                            filter: expect.objectContaining({ firstName: 'Ada' }),
                        }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('combobox', { name: 'Sortuj według' }));
        await user.click(await screen.findByText('Imię: A do Z'));
        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ sort: 'firstName:asc' }),
                    }),
                }),
            );
        });

        await user.click(screen.getByRole('button', { name: '2' }));
        await waitFor(() => {
            expect(userService.getUsers).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    params: expect.objectContaining({
                        query: expect.objectContaining({ page: 2 }),
                    }),
                }),
            );
        });
    });

    it('provides an empty state when the API returns no users', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({
            data: [],
            pagination: { total: 0 },
        } as never);
        renderUsersList();

        expect(await screen.findByText('Brak danych do wyświetlenia')).toBeVisible();
        expect(screen.getByText('Razem: 0')).toBeVisible();
    });

    it('limits user-management actions to administrators and the profile owner', async () => {
        const user = userEvent.setup();
        mocks.isAdmin = true;
        renderUsersList();

        expect(await screen.findByText('Ada Runner')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj użytkownika' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Zmień status: 2' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Zmień status: 1' })).toBeVisible();

        const ownerRow = screen.getByText('ada@example.com').closest('tr');
        const otherUserRow = screen.getByText('jan@example.com').closest('tr');
        expect(ownerRow).not.toBeNull();
        expect(otherUserRow).not.toBeNull();
        expect(ownerRow?.querySelector('[aria-label="Edytuj"]')).toBeInTheDocument();
        expect(ownerRow?.querySelector('[aria-label="Usuń"]')).toBeInTheDocument();
        expect(otherUserRow?.querySelector('[aria-label="Edytuj"]')).not.toBeInTheDocument();
        expect(otherUserRow?.querySelector('[aria-label="Usuń"]')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Zmień status: 1' }));
        expect(userService.updateUserStatus).toHaveBeenCalledWith({
            params: { path: { id: 'user-2' } },
            body: { status: 3 },
        });
    });

    it('lets an administrator create users and the owner edit or delete their own account', async () => {
        const user = userEvent.setup();
        mocks.isAdmin = true;
        renderUsersList();

        expect(await screen.findByText('Ada Runner')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Dodaj użytkownika' }));
        expect(screen.getByRole('dialog', { name: 'Nowy użytkownik' })).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz' }));

        await user.click(screen.getByRole('button', { name: 'Edytuj' }));
        expect(screen.getByRole('dialog', { name: 'Edycja użytkownika' })).toHaveTextContent('Ada');
        await user.click(screen.getByRole('button', { name: 'Zamknij formularz' }));

        await user.click(screen.getByRole('button', { name: 'Usuń' }));
        expect(mocks.confirmDelete).toHaveBeenCalledOnce();
        expect(userService.deleteUser).toHaveBeenCalledWith({ params: { path: { id: 'user-1' } } });
        expect(mocks.logout).toHaveBeenCalledOnce();
        await waitFor(() => {
            expect(screen.getByLabelText('current location')).toHaveTextContent('/login');
        });
    });

    it('hides admin actions and account management controls for a regular user viewing others', async () => {
        mocks.currentUser = { id: 'user-3', link: 'guest' };
        renderUsersList();

        expect(await screen.findByText('Ada Runner')).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Dodaj użytkownika' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Zmień status/ })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Edytuj' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Usuń' })).not.toBeInTheDocument();
        expect(screen.getAllByRole('link', { name: 'Szczegóły' })).toHaveLength(2);
    });
});
