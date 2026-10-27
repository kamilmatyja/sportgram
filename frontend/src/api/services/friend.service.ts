import { api } from '../client';
import type { components, operations } from '../schema';
import { FriendStatusEnum } from '../../enums/FriendStatusEnum';

export type FriendResource = components['schemas']['FriendResource'];
export type FriendDto = components['schemas']['FriendDto'];
export type FriendFilterDto = components['schemas']['FriendFilterDto'];
export type FriendStatusDto = components['schemas']['FriendStatusDto'];

export type GetFriendsQuery = operations['get_friend_index']['parameters']['query'];

export type GetFriendsResponse = operations['get_friend_index']['responses'][200]['content']['application/json'];
export type CreateFriendResponse = operations['post_friend_create']['responses'][201]['content']['application/json'];
export type GetFriendResponse = operations['get_friend_details']['responses'][200]['content']['application/json'];
export type DeleteFriendResponse = operations['delete_friend_delete']['responses'][200]['content']['application/json'];
export type UpdateFriendStatusResponse =
    operations['patch_friend_update_status']['responses'][200]['content']['application/json'];

export const friendService = {
    async getFriends(query?: GetFriendsQuery): Promise<GetFriendsResponse> {
        const res = await api.GET('/api/friends', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createFriend(body: FriendDto): Promise<CreateFriendResponse> {
        const res = await api.POST('/api/friends', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getFriend(id: string): Promise<GetFriendResponse> {
        const res = await api.GET('/api/friends/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteFriend(id: string): Promise<DeleteFriendResponse> {
        const res = await api.DELETE('/api/friends/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateFriendStatus(
        id: string,
        bodyOrStatus: FriendStatusDto | FriendStatusEnum,
    ): Promise<UpdateFriendStatusResponse> {
        const body: FriendStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as FriendStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/friends/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async sendFriendRequest(userId: string): Promise<CreateFriendResponse> {
        return await friendService.createFriend({ userId });
    },

    async updateStatus(
        id: string,
        status: number | FriendStatusEnum | FriendStatusDto,
    ): Promise<UpdateFriendStatusResponse> {
        const body: FriendStatusDto =
            typeof status === 'number' ? { status: status as FriendStatusDto['status'] } : status;
        return await friendService.updateFriendStatus(id, body);
    },
};
