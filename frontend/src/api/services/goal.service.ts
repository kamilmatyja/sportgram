import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { GoalStatusEnum } from '../../enums/GoalStatusEnum';

export type GoalResource = components['schemas']['GoalResource'];
export type GoalDto = components['schemas']['GoalDto'];
export type GoalFilterDto = components['schemas']['GoalFilterDto'];
export type GoalStatusDto = components['schemas']['GoalStatusDto'];
export type GoalParticipantResource = components['schemas']['GoalParticipantResource'];
export type GoalParticipantResultResource = components['schemas']['GoalParticipantResultResource'];

export type GetGoalsQuery = operations['get_goal_index']['parameters']['query'];
export type GetGoalDetailsQuery = operations['get_goal_details']['parameters']['query'];

export type GetGoalsResponse = operations['get_goal_index']['responses'][200]['content']['application/json'];
export type CreateGoalResponse = operations['post_goal_create']['responses'][201]['content']['application/json'];
export type GetGoalResponse = operations['get_goal_details']['responses'][200]['content']['application/json'];
export type UpdateGoalResponse = operations['put_goal_update']['responses'][200]['content']['application/json'];
export type DeleteGoalResponse = operations['delete_goal_delete']['responses'][200]['content']['application/json'];
export type UpdateGoalStatusResponse =
    operations['patch_goal_update_status']['responses'][200]['content']['application/json'];
export type UpdateGoalParticipantStatusResponse =
    operations['patch_goal_participant_update_status']['responses'][200]['content']['application/json'];
export type UpdateGoalParticipantResultStatusResponse =
    operations['patch_goal_participant_result_update_status']['responses'][200]['content']['application/json'];

export const goalService = {
    async getGoals(query?: GetGoalsQuery): Promise<GetGoalsResponse> {
        const res = await api.GET('/api/goals', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createGoal(body: GoalDto): Promise<CreateGoalResponse> {
        const res = await api.POST('/api/goals', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getGoal(id: string, query?: GetGoalDetailsQuery): Promise<GetGoalResponse> {
        const res = await api.GET('/api/goals/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoal(id: string, body: GoalDto): Promise<UpdateGoalResponse> {
        const res = await api.PUT('/api/goals/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteGoal(id: string): Promise<DeleteGoalResponse> {
        const res = await api.DELETE('/api/goals/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalStatus(
        id: string,
        bodyOrStatus: GoalStatusDto | GoalStatusEnum,
    ): Promise<UpdateGoalStatusResponse> {
        const body: GoalStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as GoalStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/goals/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalParticipantStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateGoalParticipantStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/goal-participants/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateGoalParticipantResultStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateGoalParticipantResultStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/goal-participant-results/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getGoalByLink(link: string): Promise<GoalResource | null> {
        const res = await api.GET('/api/goals', {
            params: {
                query: {
                    filter: { link, text: null, userId: null },
                    limit: 1,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data?.[0] ?? null;
    },
};
