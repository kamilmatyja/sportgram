import { api } from '../client';
import type { components } from '../schema';

export type TrainingResource = components['schemas']['TrainingResource'];
export type TrainingDto = components['schemas']['TrainingDto'];

export interface GetTrainingsParams {
    page?: number;
    limit?: number;
    filter?: {
        userId?: string | null;
        title?: string | null;
        link?: string | null;
    };
    sort?: string;
}

export const trainingService = {
    async getTrainings(params?: GetTrainingsParams) {
        const query: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 10,
            sort: params?.sort ?? 'createdAt:desc',
        };
        if (params?.filter) query.filter = params.filter;

        const res = await api.GET('/api/trainings', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async getTrainingByLink(link: string) {
        const res = await api.GET('/api/trainings', {
            params: {
                query: {
                    filter: { link, title: null, userId: null },
                    limit: 1,
                },
            },
        });
        if (res.error) throw res.error;
        return res.data?.data?.[0] ?? null;
    },

    async createTraining(body: TrainingDto) {
        const res = await api.POST('/api/trainings', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteTraining(id: string) {
        const res = await api.DELETE('/api/trainings/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },
};
