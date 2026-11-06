import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type GoalResource = components['schemas']['GoalResource'];
export type GoalDto = components['schemas']['GoalDto'];
export type GoalFilterDto = components['schemas']['GoalFilterDto'];
export type GoalParticipantResource = components['schemas']['GoalParticipantResource'];
export type GoalParticipantResultResource = components['schemas']['GoalParticipantResultResource'];

export type GetGoalsQuery = operations['get_goal_index']['parameters']['query'];
export type GetGoalDetailsQuery = operations['get_goal_details']['parameters']['query'];

export const goalService = {
    async getGoals(req?: ApiRequest<'get_goal_index'>): Promise<ApiResponse<'get_goal_index'>> {
        const res = await api.GET('/api/goals', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_goal_index'>;
    },
    async createGoal(req?: ApiRequest<'post_goal_create'>): Promise<ApiResponse<'post_goal_create'>> {
        const res = await api.POST('/api/goals', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_goal_create'>;
    },
    async getGoal(req?: ApiRequest<'get_goal_details'>): Promise<ApiResponse<'get_goal_details'>> {
        const res = await api.GET('/api/goals/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_goal_details'>;
    },
    async updateGoal(req?: ApiRequest<'put_goal_update'>): Promise<ApiResponse<'put_goal_update'>> {
        const res = await api.PUT('/api/goals/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_goal_update'>;
    },
    async deleteGoal(req?: ApiRequest<'delete_goal_delete'>): Promise<ApiResponse<'delete_goal_delete'>> {
        const res = await api.DELETE('/api/goals/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_goal_delete'>;
    },
    async updateGoalStatus(
        req?: ApiRequest<'patch_goal_update_status'>,
    ): Promise<ApiResponse<'patch_goal_update_status'>> {
        const res = await api.PATCH('/api/goals/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_update_status'>;
    },
    async updateGoalParticipantStatus(
        req?: ApiRequest<'patch_goal_participant_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_update_status'>> {
        const res = await api.PATCH('/api/goal-participants/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_participant_update_status'>;
    },
    async updateGoalParticipantResultStatus(
        req?: ApiRequest<'patch_goal_participant_result_update_status'>,
    ): Promise<ApiResponse<'patch_goal_participant_result_update_status'>> {
        const res = await api.PATCH('/api/goal-participant-results/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_goal_participant_result_update_status'>;
    },
};
