import { useState, useCallback } from 'react';

export function useDataFetch<T>() {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const executeFetch = useCallback(async (apiCall: () => Promise<T>, fallbackData: T) => {
        setLoading(true);
        setError(null);
        try {
            const result = await apiCall();
            setData(result);
            return result;
        } catch (err: any) {
            setError(err.error);
            setData(fallbackData);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, setData, loading, error, executeFetch };
}