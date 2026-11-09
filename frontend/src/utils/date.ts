function parseDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    const cleanStr = dateStr.includes(' ') && !dateStr.includes('T') ? dateStr.replace(' ', 'T') : dateStr;
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatDate(dateStr?: string | null): string {
    const d = parseDate(dateStr);
    if (!d) return dateStr ?? '-';
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

export function formatClockTime(dateStr?: string | null): string {
    const d = parseDate(dateStr);
    if (!d) return '';
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateTime(dateStr?: string | null): string {
    const d = parseDate(dateStr);
    if (!d) return dateStr ?? '-';
    return `${formatDate(dateStr)} ${formatClockTime(dateStr)}`;
}

export function toInputDateTime(dateStr?: string | null): string {
    return dateStr ? dateStr.replace(' ', 'T').slice(0, 16) : '';
}
