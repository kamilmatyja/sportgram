import { useEffect, useRef, useCallback } from 'react';

/**
 * Screen Wake Lock hook to prevent mobile device displays from turning off
 * during active tracking sessions (running, cycling, etc.).
 */
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
            // Wake lock request may fail (e.g., low battery mode, page not visible)
            sentinelRef.current = null;
        }
    }, []);

    const releaseLock = useCallback(async () => {
        if (sentinelRef.current) {
            try {
                await sentinelRef.current.release();
            } catch {
                // Ignore error on release
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
