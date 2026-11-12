import { describe, expect, it, vi } from 'vitest';
import { authStorage } from '../api/client';
import { friendService, userService } from '../api/services';
import { FriendStatusEnum } from '../enums/FriendStatusEnum';
import { useUserSubpageAccess } from './useUserSubpageAccess';
import { render, screen } from '../test/test-utils';

const targetUser = { id: 'target-user', link: 'target' } as never;

function AccessResult() {
    const access = useUserSubpageAccess({ targetUser });
    return <output>{`access:${access.canAccessSubpage};friend:${access.isAcceptedFriend}`}</output>;
}

describe('user subpage access', () => {
    function setCurrentUser() {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        authStorage.save('test-token', 'test-sign', true);
        vi.spyOn(userService, 'getUsers').mockResolvedValue({
            data: [{ id: 'current-user', roles: [] }],
        } as never);
    }

    it('denies access when there is no accepted friendship', async () => {
        setCurrentUser();
        vi.spyOn(friendService, 'getFriends').mockResolvedValue({ data: [] } as never);

        render(<AccessResult />);

        expect(await screen.findByText('access:false;friend:false')).toBeVisible();
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

        expect(await screen.findByText('access:true;friend:true')).toBeVisible();
    });
});
