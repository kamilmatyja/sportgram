import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { userService } from '../../api/services';
import { RoleEnum } from '../../enums/RoleEnum';
import { act, render, screen } from '../../test/test-utils';
import { UserSubpageContainer, type UserSubpageContextValue } from './UserSubpageContainer';

const access = vi.hoisted(() => ({
    useUserSubpageAccess: vi.fn(),
}));

vi.mock('../../hooks', () => ({
    useUserSubpageAccess: access.useUserSubpageAccess,
}));

vi.mock('../UserProfileNav', () => ({
    UserProfileNav: ({ user, isOwner }: { user: { firstName: string }; isOwner: boolean }) => (
        <div>
            <span>Profile navigation: {user.firstName}</span>
            <span>Owner: {String(isOwner)}</span>
        </div>
    ),
}));

const targetUser = {
    id: 'target-user',
    link: 'ada',
    firstName: 'Ada',
    lastName: 'Lovelace',
    roles: [{ role: RoleEnum.PARTICIPANT }],
};

function Content(context: UserSubpageContextValue) {
    return (
        <output>
            {`content:${context.targetUser.firstName};owner:${context.isOwner};admin:${context.isAdmin};access:${context.canAccessSubpage};role:${context.hasRequiredRole}`}
        </output>
    );
}

function renderAtUserSubpage(element: ReactNode, path: string) {
    return render(
        <Routes>
            <Route path="/users/:link/*" element={element} />
        </Routes>,
        { initialEntries: [path] },
    );
}

describe('UserSubpageContainer', () => {
    beforeEach(() => {
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [targetUser] } as never);
        access.useUserSubpageAccess.mockReturnValue({
            isOwner: false,
            isAdmin: false,
            canAccessSubpage: true,
            hasRequiredRole: true,
            isLoading: false,
        });
    });

    it('fetches the profile for the route link and renders the subpage', async () => {
        renderAtUserSubpage(
            <UserSubpageContainer>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/ada/feeds',
        );

        expect(await screen.findByText(/content:Ada/)).toBeVisible();
        expect(screen.getByText('Profile navigation: Ada')).toBeVisible();
        expect(userService.getUsers).toHaveBeenCalledWith({
            params: {
                query: {
                    filter: { link: 'ada', userIds: null },
                    'include[]': ['userDisciplines', 'userRoles'],
                    limit: 1,
                },
            },
        });
    });

    it('shows a loading indicator while the profile is being fetched', async () => {
        let resolveUsers: (result: { data: (typeof targetUser)[] }) => void = () => {};
        vi.mocked(userService.getUsers).mockReturnValue(
            new Promise((resolve) => {
                resolveUsers = resolve;
            }) as never,
        );

        renderAtUserSubpage(
            <UserSubpageContainer>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/ada/feeds',
        );

        expect(document.querySelector('.mantine-Loader-root')).toBeInTheDocument();
        await act(async () => {
            resolveUsers({ data: [targetUser] });
        });
    });

    it('shows the not-found view when no profile matches the link', async () => {
        vi.mocked(userService.getUsers).mockResolvedValue({ data: [] } as never);

        renderAtUserSubpage(
            <UserSubpageContainer>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/missing/feeds',
        );

        expect(await screen.findByText('Nie znaleziono')).toBeVisible();
        expect(screen.queryByText(/content:/)).not.toBeInTheDocument();
    });

    it('allows the owner and passes ownership in the render context', async () => {
        access.useUserSubpageAccess.mockReturnValue({
            isOwner: true,
            isAdmin: false,
            canAccessSubpage: true,
            hasRequiredRole: true,
            isLoading: false,
        });

        renderAtUserSubpage(
            <UserSubpageContainer ownerOrAdminOnly>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/ada/notifications',
        );

        expect(await screen.findByText('content:Ada;owner:true;admin:false;access:true;role:true')).toBeVisible();
    });

    it('denies a guest access to owner-only subpages', async () => {
        access.useUserSubpageAccess.mockReturnValue({
            isOwner: false,
            isAdmin: false,
            canAccessSubpage: false,
            hasRequiredRole: true,
            isLoading: false,
        });

        renderAtUserSubpage(
            <UserSubpageContainer ownerOrAdminOnly>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/ada/notifications',
        );

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(screen.queryByText(/content:/)).not.toBeInTheDocument();
    });

    it('allows an administrator to access an owner-only subpage', async () => {
        access.useUserSubpageAccess.mockReturnValue({
            isOwner: false,
            isAdmin: true,
            canAccessSubpage: true,
            hasRequiredRole: true,
            isLoading: false,
        });

        renderAtUserSubpage(
            <UserSubpageContainer ownerOrAdminOnly>{(context) => Content(context)}</UserSubpageContainer>,
            '/users/ada/notifications',
        );

        expect(await screen.findByText('content:Ada;owner:false;admin:true;access:true;role:true')).toBeVisible();
    });

    it('denies access when the profile lacks the required role', async () => {
        access.useUserSubpageAccess.mockReturnValue({
            isOwner: true,
            isAdmin: false,
            canAccessSubpage: true,
            hasRequiredRole: false,
            isLoading: false,
        });

        renderAtUserSubpage(
            <UserSubpageContainer requiredRole={RoleEnum.ORGANIZER}>
                {(context) => Content(context)}
            </UserSubpageContainer>,
            '/users/ada/pages',
        );

        expect(await screen.findByText('Brak dostępu')).toBeVisible();
        expect(screen.queryByText(/content:/)).not.toBeInTheDocument();
    });
});
