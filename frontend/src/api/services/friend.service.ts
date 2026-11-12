import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type FriendResource = components['schemas']['FriendResource'];
export type FriendDto = components['schemas']['FriendDto'];
export type FriendFilterDto = components['schemas']['FriendFilterDto'];

export type GetFriendsQuery = operations['get_friend_index']['parameters']['query'];
export type GetFriendDetailsQuery = operations['get_friend_details']['parameters']['query'];

export const friendService = {
    async getFriends(req: ApiRequest<'get_friend_index'>): Promise<ApiResponse<'get_friend_index'>> {
        const res = await api.GET('/api/friends', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async createFriend(req: ApiRequest<'post_friend_create'>): Promise<ApiResponse<'post_friend_create'>> {
        const res = await api.POST('/api/friends', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async updateFriendStatus(
        req: ApiRequest<'patch_friend_update_status'>,
    ): Promise<ApiResponse<'patch_friend_update_status'>> {
        const res = await api.PATCH('/api/friends/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async getFriend(req: ApiRequest<'get_friend_details'>): Promise<ApiResponse<'get_friend_details'>> {
        const res = await api.GET('/api/friends/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
    async deleteFriend(req: ApiRequest<'delete_friend_delete'>): Promise<ApiResponse<'delete_friend_delete'>> {
        const res = await api.DELETE('/api/friends/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
