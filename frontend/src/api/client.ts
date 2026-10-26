import createClient, { type Middleware } from 'openapi-fetch';
import i18n from '../i18n';
import type { paths } from './schema';

const TOKEN_KEY = 'token';
const SIGN_ID_KEY = 'success_sign_id';

function activeStorage(): Storage {
    return localStorage.getItem(SIGN_ID_KEY) ? localStorage : sessionStorage;
}

export const authStorage = {
    getToken: () => activeStorage().getItem(TOKEN_KEY),
    getSignId: () => activeStorage().getItem(SIGN_ID_KEY),
    save: (token: string, signId: string, rememberMe: boolean) => {
        authStorage.clear();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(SIGN_ID_KEY, signId);
    },
    setToken: (token: string) => activeStorage().setItem(TOKEN_KEY, token),
    clear: () => {
        [localStorage, sessionStorage].forEach((storage) => {
            storage.removeItem(TOKEN_KEY);
            storage.removeItem(SIGN_ID_KEY);
        });
    },
};

export const api = createClient<paths>({ baseUrl: '' });

const authMiddleware: Middleware = {
    async onRequest({ request }) {
        const token = authStorage.getToken();
        if (token) {
            request.headers.set('Authorization', `Bearer ${token}`);
        }
        return request;
    },
    async onResponse({ response }) {
        if (response.status === 401) {
            // 401 handling if required
        }
        return response;
    },
};

api.use(authMiddleware);

export function getErrorMessage(err: unknown): string {
    if (!err) return i18n.t('error');
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
        const record = err as Record<string, unknown>;
        if (typeof record.message === 'string') return record.message;
        if (typeof record.detail === 'string') return record.detail;
        if (typeof record.error === 'string') return record.error;
        if (Array.isArray(record.violations)) {
            return (record.violations as Array<{ message?: string; propertyPath?: string }>)
                .map((v) => (v.propertyPath ? `${v.propertyPath}: ${v.message}` : v.message))
                .filter(Boolean)
                .join(', ');
        }
    }
    return i18n.t('unknownError');
}
