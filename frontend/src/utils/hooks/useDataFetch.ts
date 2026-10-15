import { useState, useCallback, useRef } from 'react';

import { getErrorMessage } from '../api';

export function useDataFetch<T>() {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef<number>(0);

    const executeFetch = useCallback(
        async (apiCall: (isLatest: () => boolean) => Promise<T>, fallbackData: T | null = null) => {
            const requestId = ++requestIdRef.current;
            const isLatest = () => requestId === requestIdRef.current;

            setLoading(true);
            setError(null);
            try {
                const result = await apiCall(isLatest);
                if (isLatest()) setData(result);
                return result;
            } catch (err: unknown) {
                if (isLatest()) {
                    setError(getErrorMessage(err));
                    setData(fallbackData);
                }
                return undefined;
            } finally {
                if (isLatest()) setLoading(false);
            }
        },
        [],
    );

    return { data, setData, loading, error, executeFetch };
}
