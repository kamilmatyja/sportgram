import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

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

export const userService = {
    async getUsers(req?: ApiRequest<'get_user_index'>): Promise<ApiResponse<'get_user_index'>> {
        const res = await api.GET('/api/users', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_user_index'>;
    },
    async createUser(req?: ApiRequest<'post_user_create'>): Promise<ApiResponse<'post_user_create'>> {
        const res = await api.POST('/api/users', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_create'>;
    },
    async createUserNano(req?: ApiRequest<'post_user_create_nano'>): Promise<ApiResponse<'post_user_create_nano'>> {
        const res = await api.POST('/api/user-nano', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_user_create_nano'>;
    },
    async getUser(req?: ApiRequest<'get_user_details'>): Promise<ApiResponse<'get_user_details'>> {
        const res = await api.GET('/api/users/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_user_details'>;
    },
    async updateUser(req?: ApiRequest<'put_user_update'>): Promise<ApiResponse<'put_user_update'>> {
        const res = await api.PUT('/api/users/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_user_update'>;
    },
    async deleteUser(req?: ApiRequest<'delete_user_delete'>): Promise<ApiResponse<'delete_user_delete'>> {
        const res = await api.DELETE('/api/users/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_user_delete'>;
    },
    async updateUserStatus(
        req?: ApiRequest<'patch_user_update_status'>,
    ): Promise<ApiResponse<'patch_user_update_status'>> {
        const res = await api.PATCH('/api/users/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_user_update_status'>;
    },
};
