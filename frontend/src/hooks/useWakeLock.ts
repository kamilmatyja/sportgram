import { useEffect, useRef, useCallback } from 'react';

export function useWakeLock(enabled: boolean) {
    const sentinelRef = useRef<WakeLockSentinel | null>(null);

    const requestLock = useCallback(async () => {
        if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
            return;
        }
        try {
            if (!sentinelRef.current) {
                sentinelRef.current = await navigator.wakeLock.request('screen');
                sentinelRef.current.addEventListener('release', () => {
                    sentinelRef.current = null;
                });
            }
        } catch {
            sentinelRef.current = null;
        }
    }, []);

    const releaseLock = useCallback(async () => {
        if (sentinelRef.current) {
            try {
                await sentinelRef.current.release();
            } finally {
                sentinelRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        if (enabled) {
            void requestLock();

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible' && enabled) {
                    void requestLock();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);
            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                void releaseLock();
            };
        } else {
            void releaseLock();
        }
    }, [enabled, requestLock, releaseLock]);
}
