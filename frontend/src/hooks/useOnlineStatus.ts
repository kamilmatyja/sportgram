import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

const subscribe = (onStoreChange: () => void) => onlineManager.subscribe(onStoreChange);
const getSnapshot = () => onlineManager.isOnline();

export function useOnlineStatus(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

export function runWhenOnline(callback: () => void): void {
    if (onlineManager.isOnline()) callback();
}
