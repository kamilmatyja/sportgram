import { api } from '../client';
import type { components } from '../schema';

export type GoalResource = components['schemas']['GoalResource'];
export type GoalDto = components['schemas']['GoalDto'];

export interface GetGoalsParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
        text?: string | null;
        link?: string | null;
    };
    sort?: string;
}

export const goalService = {
    async getGoals(params?: GetGoalsParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/goals', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getGoalByLink(link: string) {
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

    async createGoal(body: GoalDto) {
        const res = await api.POST('/api/goals', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteGoal(id: string) {
        const res = await api.DELETE('/api/goals/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
