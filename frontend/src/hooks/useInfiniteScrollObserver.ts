import { useCallback, useRef } from 'react';

export interface UseInfiniteScrollObserverOptions {
    isLoading: boolean;
    hasNextPage: boolean | undefined;
    fetchNextPage: () => Promise<unknown> | void;
    root?: HTMLElement | null;
    disabled?: boolean;
}

export function useInfiniteScrollObserver({
    isLoading,
    hasNextPage,
    fetchNextPage,
    root,
    disabled = false,
}: UseInfiniteScrollObserverOptions) {
    const observer = useRef<IntersectionObserver | null>(null);

    return useCallback(
        (node: HTMLElement | null) => {
            if (observer.current) {
                observer.current.disconnect();
                observer.current = null;
            }
            if (!node || isLoading || disabled) return;
            observer.current = new IntersectionObserver(
                (entries) => {
                    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
                    if (entries[0]?.isIntersecting && hasNextPage && !disabled && !isOffline) {
                        void fetchNextPage();
                    }
                },
                root !== undefined ? { root } : undefined,
            );
            observer.current.observe(node);
        },
        [isLoading, hasNextPage, fetchNextPage, root, disabled],
    );
}
