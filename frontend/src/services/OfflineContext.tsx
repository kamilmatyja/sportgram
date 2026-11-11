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

    useEffect(() => {
        if (typeof document !== 'undefined') {
            if (isOffline) {
                document.documentElement.setAttribute('data-offline', 'true');
            } else {
                document.documentElement.removeAttribute('data-offline');
            }
        }
    }, [isOffline]);

    useEffect(() => {
        if (!isOffline) return;

        const disabledSelector = [
            '[data-offline-disabled="true"] a:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] .mantine-Anchor-root:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] button:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline-disabled="true"] .mantine-ActionIcon-root:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline-disabled="true"] .mantine-Button-root:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] .mantine-Pagination-control:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] .mantine-Menu-item:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] .mantine-UnstyledButton-root:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) a:not([data-offline-allowed="true"])',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) .mantine-Anchor-root:not([data-offline-allowed="true"])',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) button:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) .mantine-ActionIcon-root:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) .mantine-Button-root:not([data-offline-allowed="true"])',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) .mantine-UnstyledButton-root:not([data-offline-allowed="true"]):not(.mantine-Modal-close):not(.mantine-CloseButton-root)',
            '[data-offline="true"] .mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) .story-nav-btn',
        ].join(', ');

        const handleClickCapture = (e: MouseEvent) => {
            const rawTarget = e.target as HTMLElement | null;
            if (rawTarget?.closest('.mantine-Modal-close, .mantine-CloseButton-root, [data-offline-allowed="true"]')) {
                return;
            }
            const target = rawTarget?.closest(disabledSelector);
            if (target) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        };

        window.addEventListener('click', handleClickCapture, true);
        return () => {
            window.removeEventListener('click', handleClickCapture, true);
        };
    }, [isOffline]);

    useEffect(() => {
        if (!isOffline) {
            document.querySelectorAll('[data-offline-auto-disabled="true"]').forEach((el) => {
                const formEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                formEl.disabled = false;
                formEl.removeAttribute('data-offline-auto-disabled');
            });
            return;
        }

        const inputSelector = [
            '[data-offline-disabled="true"] input:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] textarea:not([data-offline-allowed="true"])',
            '[data-offline-disabled="true"] select:not([data-offline-allowed="true"])',
            '.mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) input:not([data-offline-allowed="true"])',
            '.mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) textarea:not([data-offline-allowed="true"])',
            '.mantine-Modal-root:not([data-training-modal="true"]):not([data-goal-modal="true"]):not(.training-goal-modal) select:not([data-offline-allowed="true"])',
        ].join(', ');

        const disableElements = () => {
            document.querySelectorAll(inputSelector).forEach((el) => {
                const formEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                if (!formEl.disabled) {
                    formEl.disabled = true;
                    formEl.setAttribute('data-offline-auto-disabled', 'true');
                }
            });
        };

        disableElements();

        const observer = new MutationObserver(() => {
            disableElements();
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            document.querySelectorAll('[data-offline-auto-disabled="true"]').forEach((el) => {
                const formEl = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                formEl.disabled = false;
                formEl.removeAttribute('data-offline-auto-disabled');
            });
        };
    }, [isOffline, location.pathname]);

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
