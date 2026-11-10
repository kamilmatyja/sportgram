import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';
import {
    getOfflineTrainings,
    saveOfflineTraining,
    deleteOfflineTraining,
    getOfflineCurrentUserSync,
} from '../../services/offlineStorage';

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
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const queryFilter = req?.params?.query?.filter as any;

        if (isOffline) {
            const allOffline = await getOfflineTrainings();
            if (queryFilter?.link) {
                const found = allOffline.filter((t) => t.link === queryFilter.link || t.id === queryFilter.link);
                return {
                    data: found,
                    pagination: { total: found.length, page: 1, limit: 1, totalPages: 1 },
                } as ApiResponse<'get_training_index'>;
            }
            // Requirement 9: Show only offline added trainings when offline
            const offlineOnly = allOffline.filter((t) => t.id.startsWith('offline_') || (t as any).isOffline);
            return {
                data: offlineOnly,
                pagination: {
                    total: offlineOnly.length,
                    page: 1,
                    limit: Math.max(10, offlineOnly.length),
                    totalPages: 1,
                },
            } as ApiResponse<'get_training_index'>;
        }

        try {
            const res = await api.GET('/api/trainings', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_training_index'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const allOffline = await getOfflineTrainings();
                if (queryFilter?.link) {
                    const found = allOffline.filter((t) => t.link === queryFilter.link || t.id === queryFilter.link);
                    return {
                        data: found,
                        pagination: { total: found.length, page: 1, limit: 1, totalPages: 1 },
                    } as ApiResponse<'get_training_index'>;
                }
                const offlineOnly = allOffline.filter((t) => t.id.startsWith('offline_') || (t as any).isOffline);
                return {
                    data: offlineOnly,
                    pagination: {
                        total: offlineOnly.length,
                        page: 1,
                        limit: Math.max(10, offlineOnly.length),
                        totalPages: 1,
                    },
                } as ApiResponse<'get_training_index'>;
            }
            throw err;
        }
    },

    async createTraining(req?: ApiRequest<'post_training_create'>): Promise<ApiResponse<'post_training_create'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const body = (req as any)?.body;

        if (isOffline) {
            const currentUser = getOfflineCurrentUserSync();
            const offlineId = `offline_tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const mappedDisciplines = (body?.disciplines ?? []).map((d: any, dIdx: number) => ({
                id: `offline_disc_${dIdx}_${Date.now()}`,
                discipline: Number(d.discipline),
                distances: (d.distances ?? []).map((dist: any, distIdx: number) => ({
                    id: `offline_dist_${distIdx}_${Date.now()}`,
                    distance: Number(dist.distance),
                    time: Number(dist.time) || 0,
                    subDistances: (dist.subDistances ?? []).map((sd: any, sdIdx: number) => ({
                        id: `offline_sd_${sdIdx}_${Date.now()}`,
                        subDistance: Number(sd.subDistance),
                        time: Number(sd.time) || 0,
                        lat: sd.lat ? Math.round(Number(sd.lat) * 1000000) : null,
                        lng: sd.lng ? Math.round(Number(sd.lng) * 1000000) : null,
                        accuracy: sd.accuracy ? Number(sd.accuracy) : null,
                        speed: sd.speed ? Number(sd.speed) : null,
                    })),
                })),
            }));

            const trainingResource: TrainingResource = {
                id: offlineId,
                userId: body?.userIds?.[0] || currentUser?.id || 'offline_user',
                title: body?.title || '',
                description: body?.description || '',
                link: body?.link || offlineId,
                location: body?.location || '',
                startedAt: body?.startedAt || new Date().toISOString(),
                endedAt: body?.endedAt || new Date().toISOString(),
                status: 1 as any,
                disciplines: mappedDisciplines as any,
                participants: [], // Requirement 10: empty list
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isOffline: true,
            } as any;

            await saveOfflineTraining(trainingResource, true, body);
            return { data: trainingResource } as ApiResponse<'post_training_create'>;
        }

        const res = await api.POST('/api/trainings', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'post_training_create'>;
    },

    async getTraining(req?: ApiRequest<'get_training_details'>): Promise<ApiResponse<'get_training_details'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const found = all.find((t) => t.id === targetId || t.link === targetId);
            if (found) {
                return { data: found } as ApiResponse<'get_training_details'>;
            }
        }

        try {
            const res = await api.GET('/api/trainings/{id}', req as any);
            if (res.error) throw res.error;
            return res.data as ApiResponse<'get_training_details'>;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine && targetId) {
                const all = await getOfflineTrainings();
                const found = all.find((t) => t.id === targetId || t.link === targetId);
                if (found) {
                    return { data: found } as ApiResponse<'get_training_details'>;
                }
            }
            throw err;
        }
    },

    async updateTraining(req?: ApiRequest<'put_training_update'>): Promise<ApiResponse<'put_training_update'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = (req as any)?.body;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const existing = all.find((t) => t.id === targetId || t.link === targetId);
            if (existing) {
                const mappedDisciplines = body?.disciplines
                    ? (body.disciplines ?? []).map((d: any, dIdx: number) => ({
                          id: `offline_disc_${dIdx}_${Date.now()}`,
                          discipline: Number(d.discipline),
                          distances: (d.distances ?? []).map((dist: any, distIdx: number) => ({
                              id: `offline_dist_${distIdx}_${Date.now()}`,
                              distance: Number(dist.distance),
                              time: Number(dist.time) || 0,
                              subDistances: (dist.subDistances ?? []).map((sd: any, sdIdx: number) => ({
                                  id: `offline_sd_${sdIdx}_${Date.now()}`,
                                  subDistance: Number(sd.subDistance),
                                  time: Number(sd.time) || 0,
                                  lat: sd.lat ? Math.round(Number(sd.lat) * 1000000) : null,
                                  lng: sd.lng ? Math.round(Number(sd.lng) * 1000000) : null,
                                  accuracy: sd.accuracy ? Number(sd.accuracy) : null,
                                  speed: sd.speed ? Number(sd.speed) : null,
                              })),
                          })),
                      }))
                    : existing.disciplines;

                const updated: TrainingResource = {
                    ...existing,
                    title: body?.title ?? existing.title,
                    description: body?.description ?? existing.description,
                    link: body?.link ?? existing.link,
                    location: body?.location ?? existing.location,
                    startedAt: body?.startedAt ?? existing.startedAt,
                    endedAt: body?.endedAt ?? existing.endedAt,
                    disciplines: mappedDisciplines as any,
                    updatedAt: new Date().toISOString(),
                };
                await saveOfflineTraining(updated, false, body);
                return { data: updated } as ApiResponse<'put_training_update'>;
            }
        }

        const res = await api.PUT('/api/trainings/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'put_training_update'>;
    },

    async deleteTraining(req?: ApiRequest<'delete_training_delete'>): Promise<ApiResponse<'delete_training_delete'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            await deleteOfflineTraining(targetId);
            return { data: null } as ApiResponse<'delete_training_delete'>;
        }

        const res = await api.DELETE('/api/trainings/{id}', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'delete_training_delete'>;
    },

    async updateTrainingStatus(
        req?: ApiRequest<'patch_training_update_status'>,
    ): Promise<ApiResponse<'patch_training_update_status'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = (req as any)?.body;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const existing = all.find((t) => t.id === targetId);
            if (existing) {
                existing.status = body.status;
                await saveOfflineTraining(existing, false);
                return { data: existing } as ApiResponse<'patch_training_update_status'>;
            }
            return { data: null } as ApiResponse<'patch_training_update_status'>;
        }

        const res = await api.PATCH('/api/trainings/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_training_update_status'>;
    },

    async updateTrainingParticipantStatus(
        req?: ApiRequest<'patch_training_participant_update_status'>,
    ): Promise<ApiResponse<'patch_training_participant_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_training_participant_update_status'>;
        }
        const res = await api.PATCH('/api/training-participants/{id}/status', req as any);
        if (res.error) throw res.error;
        return res.data as ApiResponse<'patch_training_participant_update_status'>;
    },
};
