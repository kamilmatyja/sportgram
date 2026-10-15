export function getAgeFromDate(dateStr?: string | null): number | undefined {
    if (!dateStr) return undefined;
    const dob = new Date(dateStr);
    if (isNaN(dob.getTime())) return undefined;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return Math.max(age, 0);
}

export function formatDate(dateStr?: string | null): string {
    if (!dateStr) return '';

    const d = new Date(dateStr);

    if (isNaN(d.getTime())) return dateStr;

    return (
        [d.getDate().toString().padStart(2, '0'), (d.getMonth() + 1).toString().padStart(2, '0'), d.getFullYear()].join(
            '.',
        ) +
        ' ' +
        d.getHours().toString().padStart(2, '0') +
        ':' +
        d.getMinutes().toString().padStart(2, '0')
    );
}
