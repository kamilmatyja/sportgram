export function updateItem<T extends { id: string }>(items: T[], id: string, updater: (item: T) => T): T[] {
    return items.map((item) => (item.id === id ? updater(item) : item));
}

export function removeItem<T extends { id: string }>(items: T[], id: string): T[] {
    return items.filter((item) => item.id !== id);
}

export function patchItem<T extends { id: string }>(items: T[], id: string, patch: Partial<T>): T[] {
    return updateItem(items, id, (item) => ({ ...item, ...patch }));
}
