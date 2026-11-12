import type { UserResource, TrainingResource, GoalResource } from '../api/services';

const DB_NAME = 'sportgram_offline';
const DB_VERSION = 1;
const USER_KEY = 'currentUser';
const LOCAL_USER_KEY = 'sportgram_offline_user';
const LOCAL_TRAININGS_KEY = 'sportgram_offline_trainings';
const LOCAL_GOALS_KEY = 'sportgram_offline_goals';
const LOCAL_SYNC_KEY = 'sportgram_offline_sync_queue';

export interface SyncAction {
    id?: number;
    type: 'CREATE_TRAINING' | 'UPDATE_TRAINING' | 'DELETE_TRAINING' | 'CREATE_GOAL' | 'UPDATE_GOAL' | 'DELETE_GOAL';
    targetId?: string;
    payload?: any;
    createdAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
        return Promise.reject(new Error('IndexedDB not supported'));
    }

    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('user')) {
                    db.createObjectStore('user');
                }
                if (!db.objectStoreNames.contains('trainings')) {
                    db.createObjectStore('trainings', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('goals')) {
                    db.createObjectStore('goals', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('syncQueue')) {
                    db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    return dbPromise;
}

function notifyServiceWorker(type: string, data: any) {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({ type, data });
    }
}

export async function saveOfflineCurrentUser(user: UserResource): Promise<void> {
    try {
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    } catch {
        void 0;
    }

    notifyServiceWorker('SET_OFFLINE_USER', user);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('user', 'readwrite');
            const store = tx.objectStore('user');
            const req = store.put(user, USER_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Failed to save user in IndexedDB, fallback to localStorage used', err);
    }
}

export function getOfflineCurrentUserSync(): UserResource | null {
    try {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        return raw ? (JSON.parse(raw) as UserResource) : null;
    } catch {
        return null;
    }
}

export async function getOfflineCurrentUser(): Promise<UserResource | null> {
    try {
        const db = await getDb();
        return await new Promise<UserResource | null>((resolve) => {
            const tx = db.transaction('user', 'readonly');
            const store = tx.objectStore('user');
            const req = store.get(USER_KEY);
            req.onsuccess = () => {
                const user = (req.result as UserResource) ?? getOfflineCurrentUserSync();
                resolve(user);
            };
            req.onerror = () => {
                resolve(getOfflineCurrentUserSync());
            };
        });
    } catch {
        return getOfflineCurrentUserSync();
    }
}

export function getOfflineTrainingsSync(): TrainingResource[] {
    try {
        const raw = localStorage.getItem(LOCAL_TRAININGS_KEY);
        return raw ? (JSON.parse(raw) as TrainingResource[]) : [];
    } catch {
        return [];
    }
}

function saveOfflineTrainingsSync(trainings: TrainingResource[]): void {
    try {
        localStorage.setItem(LOCAL_TRAININGS_KEY, JSON.stringify(trainings));
    } catch {
        void 0;
    }
    notifyServiceWorker('SET_OFFLINE_TRAININGS', trainings);
}

export async function getOfflineTrainings(userId?: string): Promise<TrainingResource[]> {
    try {
        const db = await getDb();
        const list = await new Promise<TrainingResource[]>((resolve) => {
            const tx = db.transaction('trainings', 'readonly');
            const store = tx.objectStore('trainings');
            const req = store.getAll();
            req.onsuccess = () => {
                resolve((req.result as TrainingResource[]) ?? getOfflineTrainingsSync());
            };
            req.onerror = () => resolve(getOfflineTrainingsSync());
        });

        if (userId) {
            return list.filter((t) => !t.userId || t.userId === userId);
        }
        return list;
    } catch {
        const syncList = getOfflineTrainingsSync();
        if (userId) {
            return syncList.filter((t) => !t.userId || t.userId === userId);
        }
        return syncList;
    }
}

export async function saveOfflineTraining(
    training: TrainingResource,
    isNew = false,
    originalBody?: any,
): Promise<TrainingResource> {
    const list = getOfflineTrainingsSync();
    const existingIndex = list.findIndex((t) => t.id === training.id);
    if (existingIndex >= 0) {
        list[existingIndex] = training;
    } else {
        list.unshift(training);
    }
    saveOfflineTrainingsSync(list);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('trainings', 'readwrite');
            const store = tx.objectStore('trainings');
            const req = store.put(training);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Error saving offline training to IDB', err);
    }

    if (isNew) {
        await enqueueSyncAction({
            type: 'CREATE_TRAINING',
            targetId: training.id,
            payload: originalBody || training,
            createdAt: new Date().toISOString(),
        });
    } else {
        await enqueueSyncAction({
            type: 'UPDATE_TRAINING',
            targetId: training.id,
            payload: originalBody || training,
            createdAt: new Date().toISOString(),
        });
    }

    return training;
}

export async function deleteOfflineTraining(id: string): Promise<void> {
    const list = getOfflineTrainingsSync().filter((t) => t.id !== id);
    saveOfflineTrainingsSync(list);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('trainings', 'readwrite');
            const store = tx.objectStore('trainings');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Error deleting offline training from IDB', err);
    }

    const syncQueue = getSyncQueueSync();
    const pendingCreateIdx = syncQueue.findIndex((op) => op.type === 'CREATE_TRAINING' && op.targetId === id);
    if (pendingCreateIdx >= 0) {
        syncQueue.splice(pendingCreateIdx, 1);
        saveSyncQueueSync(syncQueue);
    } else {
        await enqueueSyncAction({
            type: 'DELETE_TRAINING',
            targetId: id,
            createdAt: new Date().toISOString(),
        });
    }
}

export function getOfflineGoalsSync(): GoalResource[] {
    try {
        const raw = localStorage.getItem(LOCAL_GOALS_KEY);
        return raw ? (JSON.parse(raw) as GoalResource[]) : [];
    } catch {
        return [];
    }
}

function saveOfflineGoalsSync(goals: GoalResource[]): void {
    try {
        localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify(goals));
    } catch {
        void 0;
    }
    notifyServiceWorker('SET_OFFLINE_GOALS', goals);
}

export async function getOfflineGoals(userId?: string): Promise<GoalResource[]> {
    try {
        const db = await getDb();
        const list = await new Promise<GoalResource[]>((resolve) => {
            const tx = db.transaction('goals', 'readonly');
            const store = tx.objectStore('goals');
            const req = store.getAll();
            req.onsuccess = () => {
                resolve((req.result as GoalResource[]) ?? getOfflineGoalsSync());
            };
            req.onerror = () => resolve(getOfflineGoalsSync());
        });

        if (userId) {
            return list.filter((g) => !g.userId || g.userId === userId);
        }
        return list;
    } catch {
        const syncList = getOfflineGoalsSync();
        if (userId) {
            return syncList.filter((g) => !g.userId || g.userId === userId);
        }
        return syncList;
    }
}

export async function saveOfflineGoal(goal: GoalResource, isNew = false, originalBody?: any): Promise<GoalResource> {
    const list = getOfflineGoalsSync();
    const existingIndex = list.findIndex((g) => g.id === goal.id);
    if (existingIndex >= 0) {
        list[existingIndex] = goal;
    } else {
        list.unshift(goal);
    }
    saveOfflineGoalsSync(list);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('goals', 'readwrite');
            const store = tx.objectStore('goals');
            const req = store.put(goal);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Error saving offline goal to IDB', err);
    }

    if (isNew) {
        await enqueueSyncAction({
            type: 'CREATE_GOAL',
            targetId: goal.id,
            payload: originalBody || goal,
            createdAt: new Date().toISOString(),
        });
    } else {
        await enqueueSyncAction({
            type: 'UPDATE_GOAL',
            targetId: goal.id,
            payload: originalBody || goal,
            createdAt: new Date().toISOString(),
        });
    }

    return goal;
}

export async function deleteOfflineGoal(id: string): Promise<void> {
    const list = getOfflineGoalsSync().filter((g) => g.id !== id);
    saveOfflineGoalsSync(list);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('goals', 'readwrite');
            const store = tx.objectStore('goals');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Error deleting offline goal from IDB', err);
    }

    const syncQueue = getSyncQueueSync();
    const pendingCreateIdx = syncQueue.findIndex((op) => op.type === 'CREATE_GOAL' && op.targetId === id);
    if (pendingCreateIdx >= 0) {
        syncQueue.splice(pendingCreateIdx, 1);
        saveSyncQueueSync(syncQueue);
    } else {
        await enqueueSyncAction({
            type: 'DELETE_GOAL',
            targetId: id,
            createdAt: new Date().toISOString(),
        });
    }
}

function getSyncQueueSync(): SyncAction[] {
    try {
        const raw = localStorage.getItem(LOCAL_SYNC_KEY);
        return raw ? (JSON.parse(raw) as SyncAction[]) : [];
    } catch {
        return [];
    }
}

function saveSyncQueueSync(queue: SyncAction[]): void {
    try {
        localStorage.setItem(LOCAL_SYNC_KEY, JSON.stringify(queue));
    } catch {
        void 0;
    }
}

export async function enqueueSyncAction(action: SyncAction): Promise<void> {
    const queue = getSyncQueueSync();
    action.id = action.id ?? Date.now() + Math.floor(Math.random() * 1000);
    queue.push(action);
    saveSyncQueueSync(queue);

    try {
        const db = await getDb();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const req = store.add(action);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        console.warn('Error saving sync queue to IDB', err);
    }
}

export async function getSyncQueue(): Promise<SyncAction[]> {
    try {
        const db = await getDb();
        return await new Promise<SyncAction[]>((resolve) => {
            const tx = db.transaction('syncQueue', 'readonly');
            const store = tx.objectStore('syncQueue');
            const req = store.getAll();
            req.onsuccess = () => {
                resolve((req.result as SyncAction[]) ?? getSyncQueueSync());
            };
            req.onerror = () => resolve(getSyncQueueSync());
        });
    } catch {
        return getSyncQueueSync();
    }
}

export async function removeSyncAction(id: number): Promise<void> {
    const queue = getSyncQueueSync().filter((item) => item.id !== id);
    saveSyncQueueSync(queue);

    try {
        const db = await getDb();
        await new Promise<void>((resolve) => {
            const tx = db.transaction('syncQueue', 'readwrite');
            const store = tx.objectStore('syncQueue');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
        });
    } catch {
        void 0;
    }
}
