export function buildQueryString(include: string[] = []): string {
    const params = new URLSearchParams();
    include.forEach(inc => params.append('include[]', inc));
    return params.toString() ? `?${params.toString()}` : '';
}

export function buildIndexParams(page?: number, limit?: number, sort?: string, filter?: Record<string, any>): URLSearchParams {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (sort) params.append('sort', sort);

    if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(`filter[${key}][]`, String(v)));
                } else {
                    params.append(`filter[${key}]`, String(value));
                }
            }
        });
    }
    return params;
}

