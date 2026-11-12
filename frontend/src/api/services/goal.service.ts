import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';
import { getOfflineGoals, saveOfflineGoal, deleteOfflineGoal, getOfflineCurrentUserSync } from '../../services';

type ApiGoalResource = components['schemas']['GoalResource'];
export type OfflineGoalResource = Omit<ApiGoalResource, 'startedAt' | 'endedAt' | 'time'> & {
    startedAt: string | null;
    endedAt: string | null;
    time: number | null;
    isOffline: true;
};
export type GoalResource = ApiGoalResource | OfflineGoalResource;
export type GoalDto = components['schemas']['GoalDto'];
export type GoalFilterDto = components['schemas']['GoalFilterDto'];
export type GoalParticipantResource = components['schemas']['GoalParticipantResource'];
export type GoalParticipantResultResource = components['schemas']['GoalParticipantResultResource'];

export type GetGoalsQuery = operations['get_goal_index']['parameters']['query'];
export type GetGoalDetailsQuery = operations['get_goal_details']['parameters']['query'];

type GoalServiceResponse<Op extends keyof operations, Data> = Omit<ApiResponse<Op>, 'data'> & {
    data?: Data;
};

export const goalService = {
    async getGoals(req: ApiRequest<'get_goal_index'>): Promise<GoalServiceResponse<'get_goal_index', GoalResource[]>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const queryFilter = req.params?.query?.filter;

        if (isOffline) {
            const allOffline = await getOfflineGoals();
            if (queryFilter?.link) {
                const found = allOffline.filter((g) => g.link === queryFilter.link || g.id === queryFilter.link);
                return {
                    data: found,
                    pagination: { total: found.length, page: 1, perPage: 1 },
                };
            }
            const offlineOnly = allOffline.filter((g) => g.id.startsWith('offline_'));
            return {
                data: offlineOnly,
                pagination: {
                    total: offlineOnly.length,
                    page: 1,
                    perPage: Math.max(10, offlineOnly.length),
                },
            };
        }

        try {
            const res = await api.GET('/api/goals', req);
            if (res.error) throw res.error;
            return res.data;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const allOffline = await getOfflineGoals();
                if (queryFilter?.link) {
                    const found = allOffline.filter((g) => g.link === queryFilter.link || g.id === queryFilter.link);
                    return {
                        data: found,
                        pagination: { total: found.length, page: 1, perPage: 1 },
                    };
                }
                const offlineOnly = allOffline.filter((g) => g.id.startsWith('offline_'));
                return {
                    data: offlineOnly,
                    pagination: {
                        total: offlineOnly.length,
                        page: 1,
                        perPage: Math.max(10, offlineOnly.length),
                    },
                };
            }
            throw err;
        }
    },

    async createGoal(
        req: ApiRequest<'post_goal_create'>,
    ): Promise<GoalServiceResponse<'post_goal_create', GoalResource | { id?: string }>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const body = req.body;

        if (isOffline) {
            const currentUser = getOfflineCurrentUserSync();
            const offlineId = `offline_gl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

            const goalResource: GoalResource = {
                id: offlineId,
                userId: body.userIds?.[0] || currentUser?.id || 'offline_user',
                feedId: offlineId,
                text: body.text,
                link: body.link || offlineId,
                discipline: body.discipline,
                distance: body.distance,
                time: body.time ?? null,
                startedAt: body.startedAt ?? null,
                endedAt: body.endedAt ?? null,
                status: 1,
                participants: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isOffline: true,
            };

            await saveOfflineGoal(goalResource, true, body);
            return { data: goalResource };
        }

        const res = await api.POST('/api/goals', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async getGoal(req: ApiRequest<'get_goal_details'>): Promise<GoalServiceResponse<'get_goal_details', GoalResource>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const found = all.find((g) => g.id === targetId || g.link === targetId);
            if (found) {
                return { data: found };
            }
        }

        try {
            const res = await api.GET('/api/goals/{id}', req);
            if (res.error) throw res.error;
            return res.data;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine && targetId) {
                const all = await getOfflineGoals();
                const found = all.find((g) => g.id === targetId || g.link === targetId);
                if (found) {
                    return { data: found };
                }
            }
            throw err;
        }
    },

    async updateGoal(
        req: ApiRequest<'put_goal_update'>,
    ): Promise<GoalServiceResponse<'put_goal_update', GoalResource | { id?: string }>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = req.body;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const existing = all.find((g) => g.id === targetId || g.link === targetId);
            if (existing) {
                const updated: OfflineGoalResource = {
                    ...existing,
                    text: body?.text ?? existing.text,
                    link: body?.link ?? existing.link,
                    discipline: body.discipline,
                    distance: body.distance,
                    time: body.time !== undefined ? body.time : existing.time,
                    startedAt: body.startedAt !== undefined ? body.startedAt : existing.startedAt,
                    endedAt: body.endedAt !== undefined ? body.endedAt : existing.endedAt,
                    updatedAt: new Date().toISOString(),
                    isOffline: true,
                };
                await saveOfflineGoal(updated, false, body);
                return { data: updated };
            }
        }

        const res = await api.PUT('/api/goals/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteGoal(req: ApiRequest<'delete_goal_delete'>): Promise<ApiResponse<'delete_goal_delete'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            await deleteOfflineGoal(targetId);
            return { data: null } as ApiResponse<'delete_goal_delete'>;
        }

        const res = await api.DELETE('/api/goals/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalStatus(
        req: ApiRequest<'patch_goal_update_status'>,
    ): Promise<GoalServiceResponse<'patch_goal_update_status', GoalResource | { id?: string } | null>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = req.body;

        if (isOffline && targetId) {
            const all = await getOfflineGoals();
            const existing = all.find((g) => g.id === targetId);
            if (existing) {
                existing.status = body.status;
                await saveOfflineGoal(existing, false);
                return { data: existing };
            }
            return { data: null };
        }

        const res = await api.PATCH('/api/goals/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalParticipantStatus(
        req: ApiRequest<'patch_goal_participant_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_goal_participant_update_status'>;
        }
        const res = await api.PATCH('/api/goal-participants/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalParticipantResultStatus(
        req: ApiRequest<'patch_goal_participant_result_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_result_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_goal_participant_result_update_status'>;
        }
        const res = await api.PATCH('/api/goal-participant-results/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
