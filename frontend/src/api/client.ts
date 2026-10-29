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

function serializeQuery(params: Record<string, unknown>, prefix = ''): string[] {
    const pairs: string[] = [];
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        const paramKey = prefix ? `${prefix}[${key}]` : key;
        if (Array.isArray(value)) {
            const arrayKey = paramKey.endsWith('[]') ? paramKey : `${paramKey}[]`;
            value.forEach((item) => {
                if (item !== undefined && item !== null) {
                    pairs.push(`${encodeURIComponent(arrayKey)}=${encodeURIComponent(String(item))}`);
                }
            });
        } else if (typeof value === 'object') {
            pairs.push(...serializeQuery(value as Record<string, unknown>, paramKey));
        } else {
            pairs.push(`${encodeURIComponent(paramKey)}=${encodeURIComponent(String(value))}`);
        }
    }
    return pairs;
}

export const api = createClient<paths>({
    baseUrl: '',
    querySerializer: (params) => serializeQuery((params ?? {}) as Record<string, unknown>).join('&'),
});

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

export function extractFieldErrors(err: unknown): Record<string, string> {
    if (!err || typeof err !== 'object') return {};
    const record = err as Record<string, unknown>;
    const fieldErrors: Record<string, string> = {};

    if (record.errors && typeof record.errors === 'object') {
        for (const [key, val] of Object.entries(record.errors as Record<string, unknown>)) {
            if (Array.isArray(val)) {
                fieldErrors[key] = val
                    .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
                    .join(', ');
            } else if (typeof val === 'string') {
                fieldErrors[key] = val;
            } else if (val && typeof val === 'object') {
                fieldErrors[key] = JSON.stringify(val);
            }
        }
    }

    if (Array.isArray(record.violations)) {
        for (const v of record.violations as Array<{ message?: string; propertyPath?: string }>) {
            if (v.propertyPath && v.message) {
                fieldErrors[v.propertyPath] = fieldErrors[v.propertyPath]
                    ? `${fieldErrors[v.propertyPath]}, ${v.message}`
                    : v.message;
            }
        }
    }

    return fieldErrors;
}

export function getErrorMessage(err: unknown): string {
    if (!err) return i18n.t('error');
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
        const record = err as Record<string, unknown>;

        const fieldErrors = extractFieldErrors(err);
        const fieldErrorKeys = Object.keys(fieldErrors);
        if (fieldErrorKeys.length > 0) {
            return fieldErrorKeys.map((k) => `${k}: ${fieldErrors[k]}`).join('\n');
        }

        if (typeof record.message === 'string') return record.message;
        if (typeof record.detail === 'string') return record.detail;
        if (typeof record.error === 'string') return record.error;
    }
    return i18n.t('unknownError');
}
