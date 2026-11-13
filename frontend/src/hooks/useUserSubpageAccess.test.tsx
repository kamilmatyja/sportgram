import { describe, expect, it, vi } from 'vitest';
import { authStorage } from '../api/client';
import { friendService, userService, type UserResource } from '../api/services';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { RoleEnum } from '../enums/RoleEnum';
import { useUserSubpageAccess } from './useUserSubpageAccess';
import { render, screen } from '../test/test-utils';

const targetUser = { id: 'target-user', link: 'target', roles: [] } as never;

function AccessResult({
    target = targetUser,
    requiredRole,
}: {
    target?: UserResource | null;
    requiredRole?: RoleEnum;
}) {
    const access = useUserSubpageAccess({ targetUser: target, requiredRole });
    return (
        <output>
            {`access:${access.canAccessSubpage};friend:${access.isAcceptedFriend};owner:${access.isOwner};admin:${access.isAdmin};role:${access.hasRequiredRole}`}
        </output>
    );
}

describe('user subpage access', () => {
    function setCurrentUser(user: Record<string, unknown> = { id: 'current-user', roles: [] }) {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        authStorage.save('test-token', 'test-sign', true);
        vi.spyOn(userService, 'getUsers').mockResolvedValue({ data: [user] } as never);
    }

    it('denies access when there is no accepted friendship', async () => {
        setCurrentUser();
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);

        render(<AccessResult />);

        expect(await screen.findByText('access:false;friend:false;owner:false;admin:false;role:true')).toBeVisible();
    });

    it('allows a user with an accepted friendship to view the subpage', async () => {
        setCurrentUser();
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({
            data: [
                {
                    id: 'friendship-1',
                    senderUserId: 'current-user',
                    receiverUserId: 'target-user',
                    status: FriendStatusEnum.ACCEPTED,
                },
            ],
        } as never);

        render(<AccessResult />);

        expect(await screen.findByText('access:true;friend:true;owner:false;admin:false;role:true')).toBeVisible();
    });

    it('does not request friendship data for a guest and denies access', async () => {
        const getFriends = vi.spyOn(friendService, 'getFriends');

        render(<AccessResult />);

        expect(await screen.findByText('access:false;friend:false;owner:false;admin:false;role:true')).toBeVisible();
        expect(getFriends).not.toHaveBeenCalled();
    });

    it('recognizes the owner without requesting friendship data', async () => {
        setCurrentUser({ id: 'target-user', roles: [{ role: RoleEnum.PARTICIPANT }] });
        const getFriends = vi.spyOn(friendService, 'getFriends');

        render(<AccessResult />);

        expect(await screen.findByText('access:true;friend:false;owner:true;admin:false;role:true')).toBeVisible();
        expect(getFriends).not.toHaveBeenCalled();
    });

    it('allows administrators without requiring a friendship', async () => {
        setCurrentUser({ id: 'admin-user', roles: [{ role: RoleEnum.ADMINISTRATOR }] });
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);

        render(<AccessResult />);

        expect(await screen.findByText('access:true;friend:false;owner:false;admin:true;role:true')).toBeVisible();
    });

    it('rejects incomplete or non-accepted friendship records and missing required roles', async () => {
        setCurrentUser();
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({
            data: [
                { senderUserId: 'current-user', status: FriendStatusEnum.ACCEPTED },
                {
                    senderUserId: 'current-user',
                    receiverUserId: 'target-user',
                    status: FriendStatusEnum.PENDING,
                },
            ],
        } as never);

        render(<AccessResult target={{ id: 'target-user', roles: [] } as never} requiredRole={RoleEnum.ORGANIZER} />);

        expect(await screen.findByText('access:false;friend:false;owner:false;admin:false;role:false')).toBeVisible();
    });
});
