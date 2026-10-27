import { api } from '../client';
import type { components, operations } from '../schema';
import { UserStatusEnum } from '../../enums/UserStatusEnum';

export type UserResource = components['schemas']['UserResource'];
export type UserCreateDto = components['schemas']['UserCreateDto'];
export type UserCreateNanoDto = components['schemas']['UserCreateNanoDto'];
export type UserUpdateDto = components['schemas']['UserUpdateDto'];
export type UserStatusDto = components['schemas']['UserStatusDto'];
export type UserFilterDto = components['schemas']['UserFilterDto'];
export type UserRoleResource = components['schemas']['UserRoleResource'];
export type UserDisciplineResource = components['schemas']['UserDisciplineResource'];

export type GetUsersQuery = operations['get_user_index']['parameters']['query'];
export type GetUserDetailsQuery = operations['get_user_details']['parameters']['query'];

export type GetUsersResponse = operations['get_user_index']['responses'][200]['content']['application/json'];
export type CreateUserResponse = operations['post_user_create']['responses'][201]['content']['application/json'];
export type CreateUserNanoResponse =
    operations['post_user_create_nano']['responses'][201]['content']['application/json'];
export type GetUserResponse = operations['get_user_details']['responses'][200]['content']['application/json'];
export type UpdateUserResponse = operations['put_user_update']['responses'][200]['content']['application/json'];
export type DeleteUserResponse = operations['delete_user_delete']['responses'][200]['content']['application/json'];
export type UpdateUserStatusResponse =
    operations['patch_user_update_status']['responses'][200]['content']['application/json'];

export const userService = {
    async getUsers(query?: GetUsersQuery): Promise<GetUsersResponse> {
        const res = await api.GET('/api/users', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createUser(body: UserCreateDto): Promise<CreateUserResponse> {
        const res = await api.POST('/api/users', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async createUserNano(body: UserCreateNanoDto): Promise<CreateUserNanoResponse> {
        const res = await api.POST('/api/user-nano', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getUser(id: string, query?: GetUserDetailsQuery): Promise<GetUserResponse> {
        const res = await api.GET('/api/users/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateUser(id: string, body: UserUpdateDto): Promise<UpdateUserResponse> {
        const res = await api.PUT('/api/users/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteUser(id: string): Promise<DeleteUserResponse> {
        const res = await api.DELETE('/api/users/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateUserStatus(
        id: string,
        bodyOrStatus: UserStatusDto | UserStatusEnum,
    ): Promise<UpdateUserStatusResponse> {
        const body: UserStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as UserStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/users/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getUserBySignId(signId: string): Promise<UserResource | null> {
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

    async getUserByLink(link: string): Promise<UserResource | null> {
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

    async getUsersByIds(userIds: string[]): Promise<UserResource[]> {
        if (userIds.length === 0) return [];
        const res = await api.GET('/api/users', {
            params: {
                query: {
                    filter: { userIds },
                    limit: Math.min(Math.max(userIds.length, 10), 100),
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data ?? [];
    },
};
