import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';

export type TrainingResource = components['schemas']['TrainingResource'];
export type TrainingDto = components['schemas']['TrainingDto'];
export type TrainingFilterDto = components['schemas']['TrainingFilterDto'];
export type TrainingParticipantResource = components['schemas']['TrainingParticipantResource'];
export type TrainingDisciplineResource = components['schemas']['TrainingDisciplineResource'];
export type TrainingDisciplineDistanceResource = components['schemas']['TrainingDisciplineDistanceResource'];
export type TrainingDisciplineSubDistanceResource = components['schemas']['TrainingDisciplineSubDistanceResource'];

export type GetTrainingsQuery = operations['get_training_index']['parameters']['query'];
export type GetTrainingDetailsQuery = operations['get_training_details']['parameters']['query'];

export const trainingService = {
    async getTrainings(req?: ApiRequest<'get_training_index'>): Promise<ApiResponse<'get_training_index'>> {
        const res = await api.GET('/api/trainings', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_training_index'>;
    },
    async createTraining(req?: ApiRequest<'post_training_create'>): Promise<ApiResponse<'post_training_create'>> {
        const res = await api.POST('/api/trainings', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_training_create'>;
    },
    async getTraining(req?: ApiRequest<'get_training_details'>): Promise<ApiResponse<'get_training_details'>> {
        const res = await api.GET('/api/trainings/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'get_training_details'>;
    },
    async updateTraining(req?: ApiRequest<'put_training_update'>): Promise<ApiResponse<'put_training_update'>> {
        const res = await api.PUT('/api/trainings/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_training_update'>;
    },
    async deleteTraining(req?: ApiRequest<'delete_training_delete'>): Promise<ApiResponse<'delete_training_delete'>> {
        const res = await api.DELETE('/api/trainings/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_training_delete'>;
    },
    async updateTrainingStatus(
        req?: ApiRequest<'patch_training_update_status'>,
    ): Promise<ApiResponse<'patch_training_update_status'>> {
        const res = await api.PATCH('/api/trainings/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_training_update_status'>;
    },
    async updateTrainingParticipantStatus(
        req?: ApiRequest<'patch_training_participant_update_status'>,
    ): Promise<ApiResponse<'patch_training_participant_update_status'>> {
        const res = await api.PATCH('/api/training-participants/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_training_participant_update_status'>;
    },
};
