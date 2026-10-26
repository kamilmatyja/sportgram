import { api } from '../client';
import type { components } from '../schema';

export type UserResource = components['schemas']['UserResource'];
export type UserCreateDto = components['schemas']['UserCreateDto'];
export type UserUpdateDto = components['schemas']['UserUpdateDto'];

export interface GetUsersParams {
    page?: number;
    limit?: number;
    filter?: {
        signId?: string | null;
        userIds?: string[] | null;
        link?: string | null;
        firstName?: string | null;
        lastName?: string | null;
    };
    sort?: string;
    include?: string[];
}

export const userService = {
    async getUsers(params?: GetUsersParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
        };
        if (params?.filter) {
            query.filter = params.filter;
        }
        if (params?.sort) {
            query.sort = params.sort;
        }
        if (params?.include) {
            query['include[]'] = params.include;
        }

        const res = await api.GET('/api/users', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getUserBySignId(signId: string) {
        const res = await api.GET('/api/users', {
            params: {
                query: {
                    filter: { signId, userIds: null },
                    'include[]': ['userRoles', 'userDisciplines'],
                    limit: 1,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data?.[0] ?? null;
    },

    async getUserByLink(link: string) {
        const res = await api.GET('/api/users', {
            params: {
                query: {
                    filter: { link, userIds: null },
                    'include[]': ['userRoles', 'userDisciplines'],
                    limit: 1,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data?.[0] ?? null;
    },

    async getUsersByIds(userIds: string[]) {
        if (userIds.length === 0) return [];
        const res = await api.GET('/api/users', {
            params: {
                query: {
                    filter: { userIds, link: null, signId: null },
                    limit: userIds.length,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },

    async updateUser(id: string, body: UserUpdateDto) {
        const res = await api.PUT('/api/users/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteUser(id: string) {
        const res = await api.DELETE('/api/users/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
