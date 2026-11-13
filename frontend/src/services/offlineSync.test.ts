import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notifications } from '@mantine/notifications';
import { api } from '../api/client';
import { enqueueSyncAction, getSyncQueue } from './offlineStorage';
import { synchronizeOfflineData } from './offlineSync';

vi.mock('../api/client', () => ({
    api: {
        POST: vi.fn(),
        PUT: vi.fn(),
        DELETE: vi.fn(),
    },
}));

const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');

function setNavigatorOnline(isOnline: boolean) {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: isOnline });
}

afterEach(() => {
    if (originalOnlineDescriptor) {
        Object.defineProperty(navigator, 'onLine', originalOnlineDescriptor);
    } else {
        Reflect.deleteProperty(navigator, 'onLine');
    }
});

describe('offline data synchronization', () => {
    beforeEach(() => {
        vi.mocked(api.POST).mockReset();
        vi.mocked(api.PUT).mockReset();
        vi.mocked(api.DELETE).mockReset();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(notifications, 'show').mockImplementation(() => '');
        setNavigatorOnline(true);
    });

    it('does not sync while offline', async () => {
        setNavigatorOnline(false);
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-1',
            payload: {} as never,
            createdAt: '2026-01-01',
        });

        await expect(synchronizeOfflineData()).resolves.toBe(0);
        expect(api.POST).not.toHaveBeenCalled();
        expect(await getSyncQueue()).toHaveLength(1);
    });

    it('syncs queued goal creates, removes successful entries, and invalidates related queries', async () => {
        vi.mocked(api.POST).mockResolvedValue({ data: {} } as never);
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-1',
            payload: { text: 'Run a 5K' } as never,
            createdAt: '2026-01-01',
        });
        const queryClient = { invalidateQueries: vi.fn().mockResolvedValue(undefined) };

        await expect(synchronizeOfflineData(queryClient as never, (key) => key)).resolves.toBe(1);

        expect(api.POST).toHaveBeenCalledWith('/api/goals', { body: { text: 'Run a 5K' } });
        await expect(getSyncQueue()).resolves.toEqual([]);
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['goals'] });
        expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['user-goals'] });
        expect(notifications.show).toHaveBeenCalledWith(
            expect.objectContaining({ title: 'offlineMode', message: 'offlineSyncSuccess', color: 'green' }),
        );
    });

    it('retains failed actions and continues syncing subsequent queue entries', async () => {
        vi.mocked(api.POST)
            .mockRejectedValueOnce(new Error('Network failed'))
            .mockResolvedValueOnce({ data: {} } as never);
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-failed',
            payload: { text: 'First' } as never,
            createdAt: '2026-01-01',
        });
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-success',
            payload: { text: 'Second' } as never,
            createdAt: '2026-01-02',
        });

        await expect(synchronizeOfflineData()).resolves.toBe(1);

        await expect(getSyncQueue()).resolves.toMatchObject([{ type: 'CREATE_GOAL', targetId: 'goal-failed' }]);
        expect(console.warn).toHaveBeenCalledWith('Failed to sync item', expect.anything(), expect.any(Error));
    });

    it('keeps API-rejected actions queued', async () => {
        vi.mocked(api.POST).mockResolvedValue({ error: { message: 'Rejected' } } as never);
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: 'goal-1',
            payload: {} as never,
            createdAt: '2026-01-01',
        });

        await expect(synchronizeOfflineData()).resolves.toBe(0);
        await expect(getSyncQueue()).resolves.toMatchObject([{ type: 'CREATE_GOAL', targetId: 'goal-1' }]);
    });

    it('skips unknown queue entries without blocking valid actions', async () => {
        localStorage.setItem(
            'sportgram_offline_sync_queue',
            JSON.stringify([
                { id: 11, type: 'UNRECOGNIZED', targetId: 'legacy' },
                {
                    id: 12,
                    type: 'CREATE_GOAL',
                    targetId: 'goal-1',
                    payload: { text: 'Goal' },
                    createdAt: '2026-01-01',
                },
            ]),
        );
        vi.mocked(api.POST).mockResolvedValue({ data: {} } as never);

        await expect(synchronizeOfflineData()).resolves.toBe(1);

        await expect(getSyncQueue()).resolves.toEqual([{ id: 11, type: 'UNRECOGNIZED', targetId: 'legacy' }]);
        expect(api.POST).toHaveBeenCalledOnce();
    });
});
