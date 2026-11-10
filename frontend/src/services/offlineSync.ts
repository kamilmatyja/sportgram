import type { QueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { getSyncQueue, removeSyncAction, getOfflineTrainingsSync, getOfflineGoalsSync } from './offlineStorage';
import { api } from '../api/client';

let isSyncing = false;

export async function synchronizeOfflineData(queryClient?: QueryClient, t?: (key: string) => string): Promise<number> {
    if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine) {
        return 0;
    }

    isSyncing = true;
    let syncedCount = 0;

    try {
        const queue = await getSyncQueue();
        if (queue.length === 0) {
            return 0;
        }

        for (const action of queue) {
            try {
                if (action.type === 'CREATE_TRAINING') {
                    const res = await api.POST('/api/trainings', { body: action.payload });
                    if (!res.error) {
                        // Remove from offline store
                        const list = getOfflineTrainingsSync().filter((t) => t.id !== action.targetId);
                        localStorage.setItem('sportgram_offline_trainings', JSON.stringify(list));
                        if (action.id) await removeSyncAction(action.id);
                        syncedCount++;
                    }
                } else if (action.type === 'UPDATE_TRAINING') {
                    if (action.targetId && !action.targetId.startsWith('offline_')) {
                        const res = await api.PUT('/api/trainings/{id}', {
                            params: { path: { id: action.targetId } },
                            body: action.payload,
                        });
                        if (!res.error) {
                            if (action.id) await removeSyncAction(action.id);
                            syncedCount++;
                        }
                    } else {
                        // If it was a temp offline item, create payload was already updated
                        if (action.id) await removeSyncAction(action.id);
                    }
                } else if (action.type === 'DELETE_TRAINING') {
                    if (action.targetId && !action.targetId.startsWith('offline_')) {
                        const res = await api.DELETE('/api/trainings/{id}', {
                            params: { path: { id: action.targetId } },
                        });
                        if (!res.error) {
                            if (action.id) await removeSyncAction(action.id);
                            syncedCount++;
                        }
                    } else {
                        if (action.id) await removeSyncAction(action.id);
                    }
                } else if (action.type === 'CREATE_GOAL') {
                    const res = await api.POST('/api/goals', { body: action.payload });
                    if (!res.error) {
                        const list = getOfflineGoalsSync().filter((g) => g.id !== action.targetId);
                        localStorage.setItem('sportgram_offline_goals', JSON.stringify(list));
                        if (action.id) await removeSyncAction(action.id);
                        syncedCount++;
                    }
                } else if (action.type === 'UPDATE_GOAL') {
                    if (action.targetId && !action.targetId.startsWith('offline_')) {
                        const res = await api.PUT('/api/goals/{id}', {
                            params: { path: { id: action.targetId } },
                            body: action.payload,
                        });
                        if (!res.error) {
                            if (action.id) await removeSyncAction(action.id);
                            syncedCount++;
                        }
                    } else {
                        if (action.id) await removeSyncAction(action.id);
                    }
                } else if (action.type === 'DELETE_GOAL') {
                    if (action.targetId && !action.targetId.startsWith('offline_')) {
                        const res = await api.DELETE('/api/goals/{id}', {
                            params: { path: { id: action.targetId } },
                        });
                        if (!res.error) {
                            if (action.id) await removeSyncAction(action.id);
                            syncedCount++;
                        }
                    } else {
                        if (action.id) await removeSyncAction(action.id);
                    }
                }
            } catch (itemErr) {
                console.warn('Failed to sync item', action, itemErr);
            }
        }

        if (syncedCount > 0) {
            if (queryClient) {
                void queryClient.invalidateQueries({ queryKey: ['trainings'] });
                void queryClient.invalidateQueries({ queryKey: ['user-trainings'] });
                void queryClient.invalidateQueries({ queryKey: ['goals'] });
                void queryClient.invalidateQueries({ queryKey: ['user-goals'] });
            }

            notifications.show({
                title: t ? t('offlineMode') : 'Tryb offline',
                message: t ? t('offlineSyncSuccess') : 'Zsynchronizowano dane z trybu offline',
                color: 'green',
            });
        }
    } finally {
        isSyncing = false;
    }

    return syncedCount;
}
