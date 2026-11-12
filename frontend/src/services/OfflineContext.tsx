import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { synchronizeOfflineData } from './offlineSync';
import { OfflineInteractionPolicy } from './InteractionPolicy';

export interface OfflineContextType {
    isOnline: boolean;
    isOffline: boolean;
    interactionPolicy: OfflineInteractionPolicy;
    syncNow: () => Promise<number>;
}

const OfflineContext = createContext<OfflineContextType>({
    isOnline: true,
    isOffline: false,
    interactionPolicy: new OfflineInteractionPolicy(true, '/'),
    syncNow: async () => 0,
});

export { isTrainingsOrGoalsRoute } from './InteractionPolicy';

export function OfflineProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState<boolean>(() =>
        typeof navigator !== 'undefined' ? navigator.onLine : true,
    );
    const location = useLocation();
    const queryClient = useQueryClient();
    const { t } = useTranslation();

    const isOffline = !isOnline;
    const interactionPolicy = useMemo(
        () => new OfflineInteractionPolicy(isOnline, location.pathname),
        [isOnline, location.pathname],
    );
    const syncNow = useCallback(async () => {
        if (!navigator.onLine) return 0;
        return await synchronizeOfflineData(queryClient, t);
    }, [queryClient, t]);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            void queryClient.invalidateQueries();
            void synchronizeOfflineData(queryClient, t);
        };

        const handleOffline = () => {
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

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
            interactionPolicy,
            syncNow,
        }),
        [isOnline, isOffline, interactionPolicy, syncNow],
    );

    return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline(): OfflineContextType {
    return useContext(OfflineContext);
}
