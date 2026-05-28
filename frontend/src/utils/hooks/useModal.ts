import { useState } from 'react';

export function useModal<T = any>() {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<T | null>(null);

    const open = (initialData?: T) => {
        if (initialData !== undefined) setData(initialData);
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
    };

    return { isOpen, data, open, close, setData };
}