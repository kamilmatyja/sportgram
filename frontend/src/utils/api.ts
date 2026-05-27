const API_BASE: string = (import.meta.env.VITE_API_BASE as string) ?? '';

function buildAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...additionalHeaders,
    };
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = buildAuthHeaders(options.headers as Record<string, string> || {});
    const response = await fetch(url, {...options, headers});
    const data = await response.json();
    if (!response.ok) {
        throw data;
    }

    return data;
}