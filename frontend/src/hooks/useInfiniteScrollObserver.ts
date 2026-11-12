import { useCallback, useRef } from 'react';
import { onlineManager } from '@tanstack/react-query';

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
                    if (entries[0]?.isIntersecting && hasNextPage && !disabled && onlineManager.isOnline()) {
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
