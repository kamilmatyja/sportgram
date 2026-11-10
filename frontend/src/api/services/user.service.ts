import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';
import { getOfflineCurrentUserSync } from '../../services/offlineStorage';

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
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const queryFilter = req?.params?.query?.filter as any;

        if (isOffline) {
            const offlineUser = getOfflineCurrentUserSync();
            if (offlineUser) {
                if (queryFilter?.link && offlineUser.link === queryFilter.link) {
                    return {
                        data: [offlineUser],
                        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
                    } as ApiResponse<'get_user_index'>;
                }
                if (queryFilter?.signId && (offlineUser as any).signId === queryFilter.signId) {
                    return {
                        data: [offlineUser],
                        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
                    } as ApiResponse<'get_user_index'>;
                }
            }
            return {
                data: [],
                pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
            } as ApiResponse<'get_user_index'>;
        }

        try {
            const res = await api.GET('/api/users', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_user_index'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const offlineUser = getOfflineCurrentUserSync();
                if (offlineUser && queryFilter?.link && offlineUser.link === queryFilter.link) {
                    return {
                        data: [offlineUser],
                        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 },
                    } as ApiResponse<'get_user_index'>;
                }
                return {
                    data: [],
                    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
                } as ApiResponse<'get_user_index'>;
            }
            throw err;
        }
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
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline) {
            const offlineUser = getOfflineCurrentUserSync();
            if (offlineUser && (offlineUser.id === targetId || offlineUser.link === targetId)) {
                return { data: offlineUser } as ApiResponse<'get_user_details'>;
            }
            throw new Error('User not found in offline storage');
        }

        try {
            const res = await api.GET('/api/users/{id}', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_user_details'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const offlineUser = getOfflineCurrentUserSync();
                if (offlineUser && (offlineUser.id === targetId || offlineUser.link === targetId)) {
                    return { data: offlineUser } as ApiResponse<'get_user_details'>;
                }
            }
            throw err;
        }
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
