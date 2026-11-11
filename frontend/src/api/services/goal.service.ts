import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';
import {
    getOfflineGoals,
    saveOfflineGoal,
    deleteOfflineGoal,
    getOfflineCurrentUserSync,
} from '../../services/offlineStorage';

export type GoalResource = components['schemas']['GoalResource'];
export type GoalDto = components['schemas']['GoalDto'];
export type GoalFilterDto = components['schemas']['GoalFilterDto'];
export type GoalParticipantResource = components['schemas']['GoalParticipantResource'];
export type GoalParticipantResultResource = components['schemas']['GoalParticipantResultResource'];

export type GetGoalsQuery = operations['get_goal_index']['parameters']['query'];
export type GetGoalDetailsQuery = operations['get_goal_details']['parameters']['query'];

export const goalService = {
    async getGoals(req?: ApiRequest<'get_goal_index'>): Promise<ApiResponse<'get_goal_index'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const queryFilter = req?.params?.query?.filter as any;

        if (isOffline) {
            const allOffline = await getOfflineGoals();
            if (queryFilter?.link) {
                const found = allOffline.filter((g) => g.link === queryFilter.link || g.id === queryFilter.link);
                return {
                    data: found,
                    pagination: { total: found.length, page: 1, limit: 1, totalPages: 1 },
                } as ApiResponse<'get_goal_index'>;
            }
            const offlineOnly = allOffline.filter((g) => g.id.startsWith('offline_') || (g as any).isOffline);
            return {
                data: offlineOnly,
                pagination: {
                    total: offlineOnly.length,
                    page: 1,
                    limit: Math.max(10, offlineOnly.length),
                    totalPages: 1,
                },
            } as ApiResponse<'get_goal_index'>;
        }

        try {
            const res = await api.GET('/api/goals', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_goal_index'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const allOffline = await getOfflineGoals();
                if (queryFilter?.link) {
                    const found = allOffline.filter((g) => g.link === queryFilter.link || g.id === queryFilter.link);
                    return {
                        data: found,
                        pagination: { total: found.length, page: 1, limit: 1, totalPages: 1 },
                    } as ApiResponse<'get_goal_index'>;
                }
                const offlineOnly = allOffline.filter((g) => g.id.startsWith('offline_') || (g as any).isOffline);
                return {
                    data: offlineOnly,
                    pagination: {
                        total: offlineOnly.length,
                        page: 1,
                        limit: Math.max(10, offlineOnly.length),
                        totalPages: 1,
                    },
                } as ApiResponse<'get_goal_index'>;
            }
            throw err;
        }
    },

    async createGoal(req?: ApiRequest<'post_goal_create'>): Promise<ApiResponse<'post_goal_create'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const body = (req as any)?.body;

        if (isOffline) {
            const currentUser = getOfflineCurrentUserSync();
            const offlineId = `offline_gl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            const goalResource: GoalResource = {
                id: offlineId,
                userId: body?.userIds?.[0] || currentUser?.id || 'offline_user',
                text: body?.text || '',
                link: body?.link || offlineId,
                discipline: Number(body?.discipline) || 1,
                distance: Number(body?.distance) || 0,
                time: body?.time ? Number(body.time) : null,
                startedAt: body?.startedAt || null,
                endedAt: body?.endedAt || null,
                status: 1 as any,
                participants: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isOffline: true,
            } as any;

            await saveOfflineGoal(goalResource, true, body);
            return { data: goalResource } as ApiResponse<'post_goal_create'>;
        }

        const res = await api.POST('/api/goals', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_goal_create'>;
    },

    async getGoal(req?: ApiRequest<'get_goal_details'>): Promise<ApiResponse<'get_goal_details'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const found = all.find((g) => g.id === targetId || g.link === targetId);
            if (found) {
                return { data: found } as ApiResponse<'get_goal_details'>;
            }
        }

        try {
            const res = await api.GET('/api/goals/{id}', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_goal_details'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine && targetId) {
                const all = await getOfflineGoals();
                const found = all.find((g) => g.id === targetId || g.link === targetId);
                if (found) {
                    return { data: found } as ApiResponse<'get_goal_details'>;
                }
            }
            throw err;
        }
    },

    async updateGoal(req?: ApiRequest<'put_goal_update'>): Promise<ApiResponse<'put_goal_update'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = (req as any)?.body;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const existing = all.find((g) => g.id === targetId || g.link === targetId);
            if (existing) {
                const updated: GoalResource = {
                    ...existing,
                    text: body?.text ?? existing.text,
                    link: body?.link ?? existing.link,
                    discipline: body?.discipline ? Number(body.discipline) : existing.discipline,
                    distance: body?.distance ? Number(body.distance) : existing.distance,
                    time: body?.time !== undefined ? (body.time ? Number(body.time) : null) : existing.time,
                    startedAt: body?.startedAt !== undefined ? body.startedAt : existing.startedAt,
                    endedAt: body?.endedAt !== undefined ? body.endedAt : existing.endedAt,
                    updatedAt: new Date().toISOString(),
                };
                await saveOfflineGoal(updated, false, body);
                return { data: updated } as ApiResponse<'put_goal_update'>;
            }
        }

        const res = await api.PUT('/api/goals/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_goal_update'>;
    },

    async deleteGoal(req?: ApiRequest<'delete_goal_delete'>): Promise<ApiResponse<'delete_goal_delete'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            await deleteOfflineGoal(targetId);
            return { data: null } as ApiResponse<'delete_goal_delete'>;
        }

        const res = await api.DELETE('/api/goals/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_goal_delete'>;
    },

    async updateGoalStatus(
        req?: ApiRequest<'patch_goal_update_status'>,
    ): Promise<ApiResponse<'patch_goal_update_status'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = (req as any)?.body;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const existing = all.find((g) => g.id === targetId);
            if (existing) {
                existing.status = body.status;
                await saveOfflineGoal(existing, false);
                return { data: existing } as ApiResponse<'patch_goal_update_status'>;
            }
            return { data: null } as ApiResponse<'patch_goal_update_status'>;
        }

        const res = await api.PATCH('/api/goals/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_update_status'>;
    },

    async updateGoalParticipantStatus(
        req?: ApiRequest<'patch_goal_participant_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_goal_participant_update_status'>;
        }
        const res = await api.PATCH('/api/goal-participants/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_participant_update_status'>;
    },

    async updateGoalParticipantResultStatus(
        req?: ApiRequest<'patch_goal_participant_result_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_result_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_goal_participant_result_update_status'>;
        }
        const res = await api.PATCH('/api/goal-participant-results/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_participant_result_update_status'>;
    },
};
