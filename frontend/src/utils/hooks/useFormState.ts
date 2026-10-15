import { useState } from 'react';

import { getErrorMessage } from '../api';

export function useFormState() {
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | string[]>>({});

    const wrap = async <T>(apiCall: () => Promise<T>): Promise<T | void> => {
        setLoading(true);
        setGlobalError('');
        setFieldErrors({});
        try {
            return await apiCall();
        } catch (err: any) {
            if (err.errors) setFieldErrors(err.errors);
            else setGlobalError(getErrorMessage(err));
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetErrors = () => {
        setGlobalError('');
        setFieldErrors({});
    };

    return { loading, globalError, fieldErrors, wrap, resetErrors, setGlobalError };
}
