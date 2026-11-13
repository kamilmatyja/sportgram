import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AuthModule from '../auth';
import type * as HooksModule from '../hooks';
import { RoleEnum } from '../enums/RoleEnum';
import { render, screen } from '../test/test-utils';
import { UserProfileNav } from './UserProfileNav';

const mocks = vi.hoisted(() => ({
    currentUser: null as { id: string } | null,
    isAdmin: false,
    canAccessSubpage: true,
}));

vi.mock('../auth', async (importOriginal: () => Promise<typeof AuthModule>) => {
    const auth = await importOriginal();
    return { ...auth, useAuth: () => ({ currentUser: mocks.currentUser, isAdmin: mocks.isAdmin }) };
});

vi.mock('../hooks', async (importOriginal: () => Promise<typeof HooksModule>) => {
    const hooks = await importOriginal();
    return { ...hooks, useUserSubpageAccess: () => ({ canAccessSubpage: mocks.canAccessSubpage }) };
});

const profile = {
    id: 'user-1',
    link: 'runner',
    firstName: 'Ala',
    lastName: 'Biegaczka',
    profilePhoto: 'https://example.test/profile.jpg',
    backgroundPhoto: 'https://example.test/background.jpg',
    roles: [{ role: RoleEnum.PARTICIPANT }, { role: RoleEnum.ORGANIZER }],
};

describe('UserProfileNav', () => {
    beforeEach(() => {
        mocks.currentUser = null;
        mocks.isAdmin = false;
        mocks.canAccessSubpage = true;
    });

    it('shows profile details and links, highlights the active subpage and provides a back link', () => {
        render(<UserProfileNav user={profile} />, { initialEntries: ['/users/runner/goals/weekly-target'] });

        expect(screen.getByRole('heading', { name: 'Ala Biegaczka' })).toBeVisible();
        expect(screen.getByText('@runner')).toBeVisible();
        expect(screen.getByRole('img', { name: 'Ala' })).toHaveAttribute('src', 'https://example.test/background.jpg');
        const goalsLink = screen.getByRole('link', { name: 'Cele' });
        expect(goalsLink).toHaveAttribute('href', '/users/runner/goals');
        expect(goalsLink).toHaveAttribute('data-variant', 'filled');
        expect(screen.getByRole('link', { name: 'Treningi' })).toHaveAttribute('href', '/users/runner/trainings');
        expect(screen.getByRole('link', { name: 'Strony' })).toHaveAttribute('href', '/users/runner/pages');
        expect(screen.getByRole('link', { name: 'Wydarzenia' })).toHaveAttribute('href', '/users/runner/events');
        expect(screen.getByRole('link', { name: 'Powrót do użytkownika' })).toHaveAttribute('href', '/users/runner');
    });

    it('shows participant and organizer actions only for the corresponding profile roles', () => {
        render(
            <UserProfileNav
                user={{
                    ...profile,
                    roles: [{ role: RoleEnum.PARTICIPANT }],
                }}
                isOwner
            />,
        );

        expect(screen.getByRole('link', { name: 'Zapisy' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Treningi' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Cele' })).toBeVisible();
        expect(screen.queryByRole('link', { name: 'Strony' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Wydarzenia' })).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Powiadomienia' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Przeglądarki Push' })).toBeVisible();
    });

    it('hides owner-only actions for other users and allows them for administrators', () => {
        const { rerender } = render(<UserProfileNav user={profile} />);

        expect(screen.queryByRole('link', { name: 'Powiadomienia' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Przeglądarki Push' })).not.toBeInTheDocument();

        mocks.isAdmin = true;
        rerender(<UserProfileNav user={profile} />);
        expect(screen.getByRole('link', { name: 'Powiadomienia' })).toBeVisible();
        expect(screen.getByRole('link', { name: 'Przeglądarki Push' })).toBeVisible();
    });

    it('renders no section links when the viewer has no access to the profile', () => {
        mocks.canAccessSubpage = false;
        render(<UserProfileNav user={profile} />);

        expect(screen.queryByRole('link', { name: 'Relacje' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Cele' })).not.toBeInTheDocument();
    });

    it('renders no profile navigation when the user has no link', () => {
        render(<UserProfileNav user={{ ...profile, link: null }} />);

        expect(screen.queryByRole('heading', { name: 'Ala Biegaczka' })).not.toBeInTheDocument();
    });
});
