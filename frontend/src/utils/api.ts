import { authStorage } from './authSession';

const API_BASE: string = (import.meta.env.VITE_API_BASE as string) ?? '';

const UNKNOWN_ERROR = 'unknownError';

interface ApiError {
    status: number;
    error: string;
    errors?: Record<string, string | string[]>;
}

export function isApiError(err: unknown): err is ApiError {
    return typeof err === 'object' && err !== null && 'status' in err && 'error' in err;
}

export function getErrorMessage(err: unknown): string {
    const error = (err as { error?: unknown } | null)?.error;
    if (typeof error === 'string' && error !== '') return error;
    if (err instanceof Error && err.message) return err.message;
    return UNKNOWN_ERROR;
}

function buildHeaders(hasBody: boolean, additionalHeaders?: HeadersInit): Headers {
    const headers = new Headers(additionalHeaders);
    headers.set('Accept', 'application/json');
    if (hasBody && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    const token = authStorage.getToken();
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
}

async function parseBody(response: Response): Promise<any> {
    if (response.status === 204) return undefined;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) return undefined;
    try {
        return await response.json();
    } catch {
        return undefined;
    }
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = buildHeaders(options.body != null, options.headers);

    let response: Response;
    try {
        response = await fetch(url, { ...options, headers });
    } catch {
        throw { status: 0, error: UNKNOWN_ERROR } satisfies ApiError;
    }

    const data = await parseBody(response);
    if (!response.ok) {
        throw {
            status: response.status,
            error: data?.error || response.statusText || UNKNOWN_ERROR,
            errors: data?.errors,
        } satisfies ApiError;
    }

    return data as T;
}
