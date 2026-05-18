export function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return [
        d.getDate().toString().padStart(2, '0'),
        (d.getMonth() + 1).toString().padStart(2, '0'),
        d.getFullYear()
    ].join('.') + ' ' +
    d.getHours().toString().padStart(2, '0') + ':' +
    d.getMinutes().toString().padStart(2, '0');
}

