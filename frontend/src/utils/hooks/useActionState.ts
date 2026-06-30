import { useState } from 'react';

export function useActionState() {
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const runAction = async <T>(id: string, action: () => Promise<T>): Promise<T | void> => {
        setActionLoading(id);
        try {
            return await action();
        } catch (err: any) {
            console.error(err);
            throw err;
        } finally {
            setActionLoading(null);
        }
    };

    return { actionLoading, runAction };
}
