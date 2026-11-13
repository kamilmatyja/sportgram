import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    deleteOfflineGoal,
    enqueueSyncAction,
    getOfflineCurrentUserSync,
    getOfflineGoals,
    getOfflineGoalsSync,
    getOfflineTrainings,
    getOfflineTrainingsSync,
    getSyncQueue,
    removeSyncAction,
    saveOfflineGoal,
    saveOfflineTraining,
} from './offlineStorage';
import { DisciplineEnum } from '../enums/DisciplineEnum';

describe('offline storage fallback', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    it('returns safe empty values for malformed local data', () => {
        localStorage.setItem('sportgram_offline_user', '{');
        localStorage.setItem('sportgram_offline_goals', 'not-json');

        expect(getOfflineCurrentUserSync()).toBeNull();
        expect(getOfflineGoalsSync()).toEqual([]);
    });

    it('returns an empty queue when local queue data is malformed', async () => {
        localStorage.setItem('sportgram_offline_sync_queue', '[invalid');

        await expect(getSyncQueue()).resolves.toEqual([]);
    });

    it('persists queued synchronization actions when IndexedDB is unavailable', async () => {
        await enqueueSyncAction({
            type: 'DELETE_GOAL',
            targetId: 'goal-42',
            createdAt: '2026-01-01T00:00:00.000Z',
        });

        const queue = await getSyncQueue();
        expect(queue).toHaveLength(1);
        expect(queue[0]).toMatchObject({
            type: 'DELETE_GOAL',
            targetId: 'goal-42',
            createdAt: '2026-01-01T00:00:00.000Z',
        });
        expect(queue[0].id).toEqual(expect.any(Number));
    });

    it('appends and removes queued actions', async () => {
        await enqueueSyncAction({ type: 'DELETE_GOAL', targetId: 'goal-1', createdAt: '2026-01-01' });
        await enqueueSyncAction({ type: 'DELETE_TRAINING', targetId: 'training-1', createdAt: '2026-01-02' });
        const [firstAction] = await getSyncQueue();
        if (!firstAction?.id) throw new Error('Expected the first queued action to have an id');

        await removeSyncAction(firstAction.id);

        await expect(getSyncQueue()).resolves.toMatchObject([{ type: 'DELETE_TRAINING', targetId: 'training-1' }]);
    });

    it('persists and reads offline trainings and goals, filtering by user', async () => {
        const training = { id: 'training-1', userId: 'user-1' };
        const goal = { id: 'goal-1', userId: 'user-1' };
        await saveOfflineTraining(training as never, false, {} as never);
        await saveOfflineGoal(goal as never, false, {} as never);
        localStorage.setItem(
            'sportgram_offline_trainings',
            JSON.stringify([training, { id: 'training-2', userId: 'user-2' }]),
        );
        localStorage.setItem('sportgram_offline_goals', JSON.stringify([goal, { id: 'goal-2', userId: 'user-2' }]));

        expect(getOfflineTrainingsSync()).toEqual([training, { id: 'training-2', userId: 'user-2' }]);
        expect(getOfflineGoalsSync()).toEqual([goal, { id: 'goal-2', userId: 'user-2' }]);
        await expect(getOfflineTrainings('user-1')).resolves.toEqual([training]);
        await expect(getOfflineGoals('user-1')).resolves.toEqual([goal]);
        await expect(getOfflineTrainings('user-2')).resolves.toMatchObject([{ id: 'training-2' }]);
        await expect(getOfflineGoals('user-2')).resolves.toMatchObject([{ id: 'goal-2' }]);
    });

    it('removes a pending create when deleting an offline goal', async () => {
        localStorage.setItem('sportgram_offline_goals', JSON.stringify([{ id: 'goal-1' }]));
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-1',
            payload: {} as never,
            createdAt: '2026-01-01',
        });

        await deleteOfflineGoal('goal-1');

        expect(getOfflineGoalsSync()).toEqual([]);
        await expect(getSyncQueue()).resolves.toEqual([]);
    });

    it('rejects invalid goal discipline data without queueing a sync action', async () => {
        const invalidGoal = {
            id: 'goal-invalid',
            discipline: 999,
            startedAt: '',
            endedAt: '',
            text: '',
            link: '',
            distance: 0,
            time: 0,
            userId: 'user-1',
        };

        await expect(saveOfflineGoal(invalidGoal as never, true)).rejects.toThrow('Unsupported goal discipline: 999');
        await expect(getSyncQueue()).resolves.toEqual([]);
    });

    it('converts a valid goal to a queued create action', async () => {
        const goal = {
            id: 'goal-valid',
            discipline: DisciplineEnum.RUNNING,
            startedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
            text: 'Run a 5K',
            link: 'run-5k',
            distance: 5000,
            time: 1800,
            userId: 'user-1',
        };

        await saveOfflineGoal(goal as never, true);

        await expect(getSyncQueue()).resolves.toMatchObject([
            {
                type: 'CREATE_GOAL',
                targetId: 'goal-valid',
                payload: { discipline: DisciplineEnum.RUNNING, userIds: ['user-1'] },
            },
        ]);
    });

    it('maps complete training resources to backend DTOs and preserves missing GPS values', async () => {
        const training = {
            id: 'training-valid',
            userId: 'user-1',
            startedAt: '2026-01-01T00:00:00.000Z',
            endedAt: null,
            title: 'Morning run',
            description: null,
            link: 'morning-run',
            location: null,
            disciplines: [
                {
                    discipline: DisciplineEnum.RUNNING,
                    distances: [
                        {
                            distance: 5000,
                            time: 1800,
                            subDistances: [
                                {
                                    subDistance: 5000,
                                    time: 1800,
                                    lat: 52123456,
                                    lng: -11345678,
                                    accuracy: null,
                                    speed: 2.8,
                                },
                                {
                                    subDistance: 0,
                                    time: 0,
                                    lat: null,
                                    lng: null,
                                    accuracy: null,
                                    speed: null,
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        await saveOfflineTraining(training as never, true);

        await expect(getSyncQueue()).resolves.toMatchObject([
            {
                type: 'CREATE_TRAINING',
                targetId: 'training-valid',
                payload: {
                    title: 'Morning run',
                    userIds: ['user-1'],
                    disciplines: [
                        {
                            discipline: DisciplineEnum.RUNNING,
                            distances: [
                                {
                                    distance: 5000,
                                    subDistances: [
                                        { lat: 52.123456, lng: -11.345678, accuracy: null, speed: 2.8 },
                                        { lat: null, lng: null, accuracy: null, speed: null },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            },
        ]);
    });

    it('rejects unsupported training discipline data without queueing a sync action', async () => {
        const training = {
            id: 'training-invalid',
            userId: 'user-1',
            disciplines: [{ discipline: 999, distances: [] }],
        };

        await expect(saveOfflineTraining(training as never, true)).rejects.toThrow(
            'Unsupported training discipline: 999',
        );
        await expect(getSyncQueue()).resolves.toEqual([]);
    });
});
