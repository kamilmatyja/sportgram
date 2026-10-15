import { useState } from 'react';

import { getErrorMessage } from '../../utils/api';
import { useActionState } from '../../utils/hooks/useActionState';

export function useSafeAction() {
    const { actionLoading, runAction } = useActionState();
    const [failure, setFailure] = useState<{ id: string; error: string } | null>(null);

    const runSafeAction = async (id: string, action: () => Promise<unknown>): Promise<boolean> => {
        setFailure(null);
        try {
            await runAction(id, action);
            return true;
        } catch (err) {
            setFailure({ id, error: getErrorMessage(err) });
            return false;
        }
    };

    return {
        actionLoading,
        actionError: failure?.error ?? null,
        actionErrorId: failure?.id ?? null,
        runAction,
        runSafeAction,
    };
}
