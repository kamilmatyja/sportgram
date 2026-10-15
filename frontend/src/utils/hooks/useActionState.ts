import { useRef, useState } from 'react';

export function useActionState() {
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const inFlight = useRef<string[]>([]);

    const runAction = async <T>(id: string, action: () => Promise<T>): Promise<T | void> => {
        inFlight.current = [...inFlight.current, id];
        setActionLoading(id);
        try {
            return await action();
        } catch (err: any) {
            console.error(err);
            throw err;
        } finally {
            const index = inFlight.current.lastIndexOf(id);
            inFlight.current = inFlight.current.filter((_, i) => i !== index);
            setActionLoading(inFlight.current[inFlight.current.length - 1] ?? null);
        }
    };

    return { actionLoading, runAction };
}
