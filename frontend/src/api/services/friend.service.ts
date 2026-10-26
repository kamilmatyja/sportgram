import { api } from '../client';
import type { components } from '../schema';

export type FriendResource = components['schemas']['FriendResource'];
export type FriendFilterDto = components['schemas']['FriendFilterDto'];

export interface GetFriendsParams {
    page?: number;
    limit?: number;
    filter?: FriendFilterDto;
    sort?: 'status:asc' | 'status:desc' | 'createdAt:asc' | 'createdAt:desc';
}

export const friendService = {
    async getFriends(params?: GetFriendsParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/friends', {
            params: { query: query as any },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async sendFriendRequest(userId: string) {
        const res = await api.POST('/api/friends', {
            body: { userId },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateStatus(id: string, status: number) {
        const res = await api.PATCH('/api/friends/{id}/status', {
            params: { path: { id } },
            body: { status: status as any },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteFriend(id: string) {
        const res = await api.DELETE('/api/friends/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
