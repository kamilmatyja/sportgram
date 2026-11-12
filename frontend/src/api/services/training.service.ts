import { api } from '../client';
import type { components, operations } from '../schema';
import type { ApiRequest, ApiResponse } from '../types';
import {
    getOfflineTrainings,
    saveOfflineTraining,
    deleteOfflineTraining,
    getOfflineCurrentUserSync,
} from '../../services';

type ApiTrainingResource = components['schemas']['TrainingResource'];
type OfflineTrainingSubDistance = Omit<
    ApiTrainingResource['disciplines'][number]['distances'][number]['subDistances'][number],
    'lat' | 'lng' | 'accuracy' | 'speed'
> & {
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    speed: number | null;
};
type OfflineTrainingDistance = Omit<ApiTrainingResource['disciplines'][number]['distances'][number], 'subDistances'> & {
    subDistances: OfflineTrainingSubDistance[];
};
type OfflineTrainingDiscipline = Omit<ApiTrainingResource['disciplines'][number], 'distances'> & {
    distances: OfflineTrainingDistance[];
};
export type OfflineTrainingResource = Omit<ApiTrainingResource, 'disciplines'> & {
    disciplines: OfflineTrainingDiscipline[];
};
export type TrainingResource = ApiTrainingResource | OfflineTrainingResource;
export type TrainingDto = components['schemas']['TrainingDto'];
export type TrainingDisciplineDto = components['schemas']['TrainingDisciplineDto'];
export type TrainingFilterDto = components['schemas']['TrainingFilterDto'];
export type TrainingParticipantResource = components['schemas']['TrainingParticipantResource'];
export type TrainingDisciplineResource = components['schemas']['TrainingDisciplineResource'];
export type TrainingDisciplineDistanceResource = components['schemas']['TrainingDisciplineDistanceResource'];
export type TrainingDisciplineSubDistanceResource = components['schemas']['TrainingDisciplineSubDistanceResource'];

export type GetTrainingsQuery = operations['get_training_index']['parameters']['query'];
export type GetTrainingDetailsQuery = operations['get_training_details']['parameters']['query'];

function mapOfflineDisciplines(
    disciplines: TrainingDto['disciplines'],
    trainingId: string,
): OfflineTrainingResource['disciplines'] {
    const timestamp = new Date().toISOString();

    return (disciplines ?? []).map((discipline, disciplineIndex) => {
        const disciplineId = `offline_disc_${disciplineIndex}_${Date.now()}`;
        return {
            id: disciplineId,
            trainingId,
            createdAt: timestamp,
            updatedAt: timestamp,
            discipline: discipline.discipline,
            distances: (discipline.distances ?? []).map((distance, distanceIndex) => {
                const distanceId = `offline_dist_${distanceIndex}_${Date.now()}`;
                return {
                    id: distanceId,
                    trainingDisciplineId: disciplineId,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                    distance: distance.distance,
                    time: distance.time,
                    subDistances: (distance.subDistances ?? []).map((subDistance, subDistanceIndex) => ({
                        id: `offline_sd_${subDistanceIndex}_${Date.now()}`,
                        trainingDisciplineDistanceId: distanceId,
                        createdAt: timestamp,
                        updatedAt: timestamp,
                        subDistance: subDistance.subDistance,
                        time: subDistance.time,
                        lat: subDistance.lat ? Math.round(subDistance.lat * 1_000_000) : null,
                        lng: subDistance.lng ? Math.round(subDistance.lng * 1_000_000) : null,
                        accuracy: subDistance.accuracy || null,
                        speed: subDistance.speed || null,
                    })),
                };
            }),
        };
    });
}

type TrainingServiceResponse<Op extends keyof operations, Data> = Omit<ApiResponse<Op>, 'data'> & {
    data?: Data;
};

export const trainingService = {
    async getTrainings(
        req: ApiRequest<'get_training_index'>,
    ): Promise<TrainingServiceResponse<'get_training_index', TrainingResource[]>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const queryFilter = req.params?.query?.filter;

        if (isOffline) {
            const allOffline = await getOfflineTrainings();
            if (queryFilter?.link) {
                const found = allOffline.filter((t) => t.link === queryFilter.link || t.id === queryFilter.link);
                return {
                    data: found,
                    pagination: { total: found.length, page: 1, perPage: 1, hasNextPage: false },
                };
            }
            const offlineOnly = allOffline.filter((t) => t.id.startsWith('offline_'));
            return {
                data: offlineOnly,
                pagination: {
                    total: offlineOnly.length,
                    page: 1,
                    perPage: Math.max(10, offlineOnly.length),
                    hasNextPage: false,
                },
            };
        }

        try {
            const res = await api.GET('/api/trainings', req);
            if (res.error) throw res.error;
            return res.data;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                const allOffline = await getOfflineTrainings();
                if (queryFilter?.link) {
                    const found = allOffline.filter((t) => t.link === queryFilter.link || t.id === queryFilter.link);
                    return {
                        data: found,
                        pagination: { total: found.length, page: 1, perPage: 1, hasNextPage: false },
                    };
                }
                const offlineOnly = allOffline.filter((t) => t.id.startsWith('offline_'));
                return {
                    data: offlineOnly,
                    pagination: {
                        total: offlineOnly.length,
                        page: 1,
                        perPage: Math.max(10, offlineOnly.length),
                        hasNextPage: false,
                    },
                };
            }
            throw err;
        }
    },

    async createTraining(
        req: ApiRequest<'post_training_create'>,
    ): Promise<TrainingServiceResponse<'post_training_create', TrainingResource | { id?: string }>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const body = req.body;

        if (isOffline) {
            const currentUser = getOfflineCurrentUserSync();
            const offlineId = `offline_tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const trainingResource: OfflineTrainingResource = {
                id: offlineId,
                feedId: offlineId,
                userId: body.userIds?.[0] || currentUser?.id || 'offline_user',
                title: body.title,
                description: body.description,
                link: body.link,
                location: body.location,
                startedAt: body.startedAt,
                endedAt: body.endedAt,
                status: 1,
                disciplines: mapOfflineDisciplines(body.disciplines, offlineId),
                participants: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await saveOfflineTraining(trainingResource, true, body);
            return { data: trainingResource };
        }

        const res = await api.POST('/api/trainings', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async getTraining(
        req: ApiRequest<'get_training_details'>,
    ): Promise<TrainingServiceResponse<'get_training_details', TrainingResource>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const found = all.find((t) => t.id === targetId || t.link === targetId);
            if (found) {
                return { data: found };
            }
        }

        try {
            const res = await api.GET('/api/trainings/{id}', req);
            if (res.error) throw res.error;
            return res.data;
        } catch (err) {
            if (typeof navigator !== 'undefined' && !navigator.onLine && targetId) {
                const all = await getOfflineTrainings();
                const found = all.find((t) => t.id === targetId || t.link === targetId);
                if (found) {
                    return { data: found };
                }
            }
            throw err;
        }
    },

    async updateTraining(
        req: ApiRequest<'put_training_update'>,
    ): Promise<TrainingServiceResponse<'put_training_update', TrainingResource | { id?: string }>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = req.body;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const existing = all.find((t) => t.id === targetId || t.link === targetId);
            if (existing) {
                const mappedDisciplines =
                    body.disciplines === null
                        ? existing.disciplines
                        : mapOfflineDisciplines(body.disciplines, existing.id);

                const updated: OfflineTrainingResource = {
                    ...existing,
                    title: body.title,
                    description: body.description,
                    link: body.link,
                    location: body.location,
                    startedAt: body.startedAt,
                    endedAt: body.endedAt,
                    disciplines: mappedDisciplines,
                    updatedAt: new Date().toISOString(),
                };
                await saveOfflineTraining(updated, false, body);
                return { data: updated };
            }
        }

        const res = await api.PUT('/api/trainings/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async deleteTraining(req: ApiRequest<'delete_training_delete'>): Promise<ApiResponse<'delete_training_delete'>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;

        if (isOffline && targetId) {
            await deleteOfflineTraining(targetId);
            return { data: null } as ApiResponse<'delete_training_delete'>;
        }

        const res = await api.DELETE('/api/trainings/{id}', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async updateTrainingStatus(
        req: ApiRequest<'patch_training_update_status'>,
    ): Promise<TrainingServiceResponse<'patch_training_update_status', TrainingResource | { id?: string } | null>> {
        const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
        const targetId = req?.params?.path?.id;
        const body = req.body;

        if (isOffline && targetId) {
            const all = await getOfflineTrainings();
            const existing = all.find((t) => t.id === targetId);
            if (existing) {
                existing.status = body.status;
                await saveOfflineTraining(existing, false);
                return { data: existing };
            }
            return { data: null };
        }

        const res = await api.PATCH('/api/trainings/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },

    async updateTrainingParticipantStatus(
        req: ApiRequest<'patch_training_participant_update_status'>,
    ): Promise<ApiResponse<'patch_training_participant_update_status'>> {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return { data: null } as ApiResponse<'patch_training_participant_update_status'>;
        }
        const res = await api.PATCH('/api/training-participants/{id}/status', req);
        if (res.error) throw res.error;
        return res.data;
    },
};
