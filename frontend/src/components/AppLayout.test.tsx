import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocation } from 'react-router-dom';
import type * as AuthModule from '../auth';
import type * as HooksModule from '../hooks';
import { render, screen, userEvent } from '../test/test-utils';
import { RoleEnum } from '../enums/RoleEnum';
import { AppLayout } from './AppLayout';
import { UserProfileNav } from './UserProfileNav';

const mocks = vi.hoisted(() => ({
    auth: {
        isAuthenticated: false,
        currentUser: null as null | { id: string; link: string; firstName: string; lastName: string },
        isAdmin: false,
        logout: vi.fn(),
    },
}));

vi.mock('../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => mocks.auth };
});

vi.mock('../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return {
        ...hooks,
        useUserSubpageAccess: () => ({ canAccessSubpage: true }),
    };
});

function renderLayout(initialEntries = ['/']) {
    return render(
        <AppLayout>
            <h1>Strona testowa</h1>
            <CurrentPath />
        </AppLayout>,
        { initialEntries },
    );
}

function CurrentPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

describe('AppLayout and navigation', () => {
    beforeEach(() => {
        mocks.auth.isAuthenticated = false;
        mocks.auth.currentUser = null;
        mocks.auth.isAdmin = false;
        mocks.auth.logout.mockReset();
    });

    it('shows guest sign-in, registration, language and theme controls without authenticated navigation', () => {
        renderLayout();

        expect(screen.getByRole('button', { name: 'Logowanie' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Rejestracja' })).toBeVisible();
        expect(screen.getByRole('radio', { name: 'PL' })).toBeVisible();
        expect(screen.getByRole('radio', { name: 'EN' })).toBeVisible();
        expect(screen.getByRole('button', { name: 'Przełącz motyw' })).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Użytkownicy' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Strona testowa' })).toBeVisible();
    });

    it('shows authenticated links, marks the active section and opens profile/logout actions', async () => {
        const user = userEvent.setup();
        mocks.auth.isAuthenticated = true;
        mocks.auth.currentUser = {
            id: 'user-1',
            link: 'runner',
            firstName: 'Ala',
            lastName: 'Biegaczka',
        };
        renderLayout(['/events']);

        for (const label of ['Użytkownicy', 'Strony', 'Wydarzenia', 'Statystyki']) {
            expect(screen.getByRole('button', { name: label })).toBeVisible();
        }
        expect(screen.getByRole('button', { name: 'Wydarzenia' })).toHaveAttribute('data-variant', 'light');
        expect(screen.getByRole('button', { name: 'Strony' })).toHaveAttribute('data-variant', 'subtle');
        expect(screen.queryByRole('button', { name: 'Logowanie' })).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Ala Biegaczka/ }));
        await user.click(await screen.findByRole('menuitem', { name: 'Wyloguj się' }));
        expect(mocks.auth.logout).toHaveBeenCalledOnce();
    });

    it('navigates through section links and highlights the selected section', async () => {
        const user = userEvent.setup();
        mocks.auth.isAuthenticated = true;
        mocks.auth.currentUser = {
            id: 'user-1',
            link: 'runner',
            firstName: 'Ala',
            lastName: 'Biegaczka',
        };
        const { container } = renderLayout();

        await user.click(screen.getByRole('button', { name: 'Strony' }));
        expect(screen.getByLabelText('current location')).toHaveTextContent('/pages');
        expect(container.querySelector('button[data-variant="light"]')).toHaveTextContent('Strony');
    });

    it('shows profile navigation actions according to the profile roles', () => {
        mocks.auth.isAuthenticated = true;
        mocks.auth.currentUser = {
            id: 'profile-1',
            link: 'runner',
            firstName: 'Ala',
            lastName: 'Biegaczka',
        };
        render(
            <AppLayout>
                <UserProfileNav
                    isOwner
                    user={{
                        id: 'profile-1',
                        link: 'runner',
                        firstName: 'Ala',
                        lastName: 'Biegaczka',
                        roles: [{ role: RoleEnum.PARTICIPANT }],
                    }}
                />
            </AppLayout>,
        );

        expect(screen.getByRole('link', { name: 'Treningi' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Cele' })).toBeVisible();
        expect(screen.queryByRole('link', { name: 'Wydarzenia' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Powiadomienia' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Przeglądarki Push' })).toBeVisible();
    });

    it('shows organizer-only profile sections and suppresses participant-only sections', () => {
        mocks.auth.isAuthenticated = true;
        mocks.auth.currentUser = {
            id: 'profile-1',
            link: 'runner',
            firstName: 'Ala',
            lastName: 'Biegaczka',
        };
        render(
            <AppLayout>
                <UserProfileNav
                    isOwner
                    user={{
                        id: 'profile-1',
                        link: 'runner',
                        firstName: 'Ala',
                        lastName: 'Biegaczka',
                        roles: [{ role: RoleEnum.ORGANIZER }],
                    }}
                />
            </AppLayout>,
        );

        expect(screen.getByRole('link', { name: 'Strony' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Wydarzenia' })).toBeVisible();
        expect(screen.queryByRole('link', { name: 'Treningi' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Cele' })).not.toBeInTheDocument();
    });
});
