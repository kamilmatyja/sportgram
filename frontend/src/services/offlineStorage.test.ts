import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enqueueSyncAction, getOfflineCurrentUserSync, getOfflineGoalsSync, getSyncQueue } from './offlineStorage';

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
});
