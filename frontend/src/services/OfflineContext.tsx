import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { synchronizeOfflineData } from './offlineSync';

export interface OfflineContextType {
    isOnline: boolean;
    isOffline: boolean;
    isTrainingsOrGoalsPage: boolean;
    isOfflineDisabled: boolean;
    syncNow: () => Promise<number>;
}

const OfflineContext = createContext<OfflineContextType>({
    isOnline: true,
    isOffline: false,
    isTrainingsOrGoalsPage: false,
    isOfflineDisabled: false,
    syncNow: async () => 0,
});

export function isTrainingsOrGoalsRoute(pathname: string): boolean {
    return pathname.includes('/trainings') || pathname.includes('/goals');
}

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState<boolean>(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );
    const location = useLocation();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const isTrainingsOrGoalsPage = useMemo(() => isTrainingsOrGoalsRoute(location.pathname), [location.pathname]);

    const isOffline = !isOnline;
    const isOfflineDisabled = isOffline && !isTrainingsOrGoalsPage;

    const syncNow = useCallback(async () => {
        if (!navigator.onLine) return 0;
        return await synchronizeOfflineData(queryClient, t);
    }, [queryClient, t]);

    // Requirement 13: clear inactive cache on route navigation so returning to a page doesn't show old content
    const prevPathRef = useRef(location.pathname);
    useEffect(() => {
        if (prevPathRef.current !== location.pathname) {
            prevPathRef.current = location.pathname;
            queryClient.removeQueries({ type: 'inactive' });
        }
    }, [location.pathname, queryClient]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            queryClient.removeQueries({ type: 'inactive' });
            void queryClient.invalidateQueries();
            void synchronizeOfflineData(queryClient, t);
        };

        const handleOffline = () => {
            setIsOnline(false);
            queryClient.removeQueries({ type: 'inactive' });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Run sync on mount if online
        if (navigator.onLine) {
            void synchronizeOfflineData(queryClient, t);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [queryClient, t]);

    const value = useMemo(
        () => ({
            isOnline,
            isOffline,
            isTrainingsOrGoalsPage,
            isOfflineDisabled,
            syncNow,
        }),
        [isOnline, isOffline, isTrainingsOrGoalsPage, isOfflineDisabled, syncNow],
    );

    return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextType {
    return useContext(OfflineContext);
}
