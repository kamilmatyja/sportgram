import createClient, { type Middleware } from 'openapi-fetch';
import i18n from '../i18n';
import type { paths } from './schema';

const TOKEN_KEY = 'token';
const SIGN_ID_KEY = 'success_sign_id';

const getStorage = () =>
    localStorage.getItem(SIGN_ID_KEY) || localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;

export const authStorage = {
    getToken: () => getStorage().getItem(TOKEN_KEY),
    getSignId: () => getStorage().getItem(SIGN_ID_KEY),
    save: (token: string, signId: string, rememberMe: boolean) => {
        authStorage.clear();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(SIGN_ID_KEY, signId);
    },
    setToken: (token: string) => getStorage().setItem(TOKEN_KEY, token),
    clear: () =>
        [localStorage, sessionStorage].forEach((s) => {
            s.removeItem(TOKEN_KEY);
            s.removeItem(SIGN_ID_KEY);
        }),
};

function serializeQuery(params: Record<string, unknown>, prefix = ''): string[] {
    const pairs: string[] = [];
    for (const [key, val] of Object.entries(params)) {
        if (val === undefined || val === null) continue;
        const paramKey = prefix ? `${prefix}[${key}]` : key;

        if (Array.isArray(val)) {
            const arrayKey = paramKey.endsWith('[]') ? paramKey : `${paramKey}[]`;
            for (const item of val) {
                if (item === undefined || item === null) continue;
                const str = typeof item === 'object' ? ((item as any).id ?? (item as any).value) : item;
                if (str !== undefined && str !== null) {
                    pairs.push(`${encodeURIComponent(arrayKey)}=${encodeURIComponent(String(str))}`);
                }
            }
        } else if (typeof val === 'object') {
            pairs.push(...serializeQuery(val as Record<string, unknown>, paramKey));
        } else {
            pairs.push(`${encodeURIComponent(paramKey)}=${encodeURIComponent(String(val))}`);
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
            authStorage.clear();
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
        return response;
    },
};

api.use(authMiddleware);

export async function unwrap<T>(promise: Promise<{ data?: T; error?: unknown }>): Promise<T> {
    const { data, error } = await promise;
    if (error) throw error;
    return data as T;
}

export function extractFieldErrors(err: unknown): Record<string, string> {
    if (!err || typeof err !== 'object') return {};
    const record = err as Record<string, unknown>;
    const fieldErrors: Record<string, string> = {};

    const append = (field?: unknown, message?: unknown) => {
        if (!field || typeof field !== 'string') return;
        const msg = typeof message === 'string' ? message : JSON.stringify(message ?? '');
        if (msg) {
            fieldErrors[field] = fieldErrors[field] ? `${fieldErrors[field]}, ${msg}` : msg;
        }
    };

    const errors = record.errors ?? record.violations ?? record.details;

    if (Array.isArray(errors)) {
        for (const item of errors) {
            if (typeof item === 'object' && item !== null) {
                const itemRec = item as Record<string, unknown>;
                const field = itemRec.field ?? itemRec.property ?? itemRec.propertyPath ?? itemRec.path;
                const message = itemRec.message ?? itemRec.error ?? itemRec.detail;
                append(field, message);
            }
        }
    } else if (errors && typeof errors === 'object') {
        for (const [key, val] of Object.entries(errors)) {
            if (Array.isArray(val)) {
                fieldErrors[key] = val
                    .map((item) => (typeof item === 'string' ? item : (item?.message ?? JSON.stringify(item))))
                    .join(', ');
            } else if (typeof val === 'string') {
                fieldErrors[key] = val;
            } else if (val && typeof val === 'object' && 'message' in val) {
                fieldErrors[key] = String((val as { message: unknown }).message);
            } else {
                fieldErrors[key] = JSON.stringify(val);
            }
        }
    }

    if (Array.isArray(record.violations)) {
        for (const v of record.violations) {
            append(v.propertyPath, v.message);
        }
    }

    return fieldErrors;
}

export function getErrorMessage(err: unknown): string {
    if (!err) return i18n.t('error');
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
        if (Object.keys(extractFieldErrors(err)).length > 0) {
            return i18n.t('validationError');
        }
        const record = err as Record<string, unknown>;
        const msg = record.message ?? record.detail ?? record.error;
        if (typeof msg === 'string') return msg;
    }
    return i18n.t('unknownError');
}
