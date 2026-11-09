import { useCallback, useRef } from 'react';

export interface UseInfiniteScrollObserverOptions {
    isLoading: boolean;
    hasNextPage: boolean | undefined;
    fetchNextPage: () => Promise<unknown> | void;
    root?: HTMLElement | null;
}

export function useInfiniteScrollObserver({
    isLoading,
    hasNextPage,
    fetchNextPage,
    root,
}: UseInfiniteScrollObserverOptions) {
    const observer = useRef<IntersectionObserver | null>(null);

    return useCallback(
        (node: HTMLElement | null) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
            if (!node) return;
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting && hasNextPage) {
                        void fetchNextPage();
                    }
                },
                root !== undefined ? { root } : undefined,
            );
            observer.current.observe(node);
        },
        [isLoading, hasNextPage, fetchNextPage, root],
    );
}
