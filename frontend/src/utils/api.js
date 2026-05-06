const API_BASE = import.meta.env.VITE_API_BASE ?? '';

export async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
    };

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
        throw data;
    }

    return data;
}