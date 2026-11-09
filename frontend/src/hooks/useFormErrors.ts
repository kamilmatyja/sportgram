import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { extractFieldErrors, getErrorMessage } from '../api/client';

export function useFormErrors() {
    const { t } = useTranslation();
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleFormError = useCallback(
        (err: unknown, options?: { notifyOnlyIfNoFields?: boolean }) => {
            const fe = extractFieldErrors(err);
            setFieldErrors(fe);
            const msg = getErrorMessage(err);
            if (!options?.notifyOnlyIfNoFields || Object.keys(fe).length === 0) {
                notifications.show({ title: t('error'), message: msg, color: 'red' });
            }
            return { fe, msg };
        },
        [t],
    );

    const clearFieldError = useCallback((field: string) => {
        setFieldErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const clearFieldErrors = useCallback(() => setFieldErrors({}), []);

    return {
        fieldErrors,
        errors: fieldErrors,
        setFieldErrors,
        clearFieldError,
        clearFieldErrors,
        clearErrors: clearFieldErrors,
        handleFormError,
        setFromError: handleFormError,
    };
}
