import { api } from '../client';
import type { components, operations } from '../schema';
import type { ElementStatusDto } from './common.types';
import { ElementStatusEnum } from '../../enums/ElementStatusEnum';
import { SaveStatusEnum } from '../../enums/SaveStatusEnum';

export type TrainingResource = components['schemas']['TrainingResource'];
export type TrainingDto = components['schemas']['TrainingDto'];
export type TrainingFilterDto = components['schemas']['TrainingFilterDto'];
export type TrainingParticipantResource = components['schemas']['TrainingParticipantResource'];
export type SaveStatusDto = components['schemas']['SaveStatusDto'];

export type GetTrainingsQuery = operations['get_training_index']['parameters']['query'];
export type GetTrainingDetailsQuery = operations['get_training_details']['parameters']['query'];

export type GetTrainingsResponse = operations['get_training_index']['responses'][200]['content']['application/json'];
export type CreateTrainingResponse =
    operations['post_training_create']['responses'][201]['content']['application/json'];
export type GetTrainingResponse = operations['get_training_details']['responses'][200]['content']['application/json'];
export type UpdateTrainingResponse = operations['put_training_update']['responses'][200]['content']['application/json'];
export type DeleteTrainingResponse =
    operations['delete_training_delete']['responses'][200]['content']['application/json'];
export type UpdateTrainingStatusResponse =
    operations['patch_training_update_status']['responses'][200]['content']['application/json'];
export type UpdateTrainingParticipantStatusResponse =
    operations['patch_training_participant_update_status']['responses'][200]['content']['application/json'];

export const trainingService = {
    async getTrainings(query?: GetTrainingsQuery): Promise<GetTrainingsResponse> {
        const res = await api.GET('/api/trainings', {
            params: { query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async createTraining(body: TrainingDto): Promise<CreateTrainingResponse> {
        const res = await api.POST('/api/trainings', { body });
        if (res.error) throw res.error;
        return res.data;
    },

    async getTraining(id: string, query?: GetTrainingDetailsQuery): Promise<GetTrainingResponse> {
        const res = await api.GET('/api/trainings/{id}', {
            params: { path: { id }, query },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateTraining(id: string, body: TrainingDto): Promise<UpdateTrainingResponse> {
        const res = await api.PUT('/api/trainings/{id}', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteTraining(id: string): Promise<DeleteTrainingResponse> {
        const res = await api.DELETE('/api/trainings/{id}', {
            params: { path: { id } },
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateTrainingStatus(
        id: string,
        bodyOrStatus: ElementStatusDto | ElementStatusEnum,
    ): Promise<UpdateTrainingStatusResponse> {
        const body: ElementStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as ElementStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/trainings/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    async updateTrainingParticipantStatus(
        id: string,
        bodyOrStatus: SaveStatusDto | SaveStatusEnum,
    ): Promise<UpdateTrainingParticipantStatusResponse> {
        const body: SaveStatusDto =
            typeof bodyOrStatus === 'number' ? { status: bodyOrStatus as SaveStatusDto['status'] } : bodyOrStatus;
        const res = await api.PATCH('/api/training-participants/{id}/status', {
            params: { path: { id } },
            body,
        });
        if (res.error) throw res.error;
        return res.data;
    },

    // Convenience helpers
    async getTrainingByLink(link: string): Promise<TrainingResource | null> {
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
};
