import { formatDistance, formatTime } from './format';

export function truncate(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatFeedOrigin(origin: string | null | undefined, t: (key: string) => string): string {
    if (!origin) return '';
    let res = origin.replace(/\{([^}]+)\}/g, (_, token: string) => {
        if (token.startsWith('discipline:')) {
            const rawName = token.slice('discipline:'.length).trim();
            const camelCase = rawName.charAt(0).toLowerCase() + rawName.slice(1);
            const disciplineKey = `disciplineTypes.${camelCase}`;
            const translated = t(disciplineKey);
            if (translated && translated !== disciplineKey) {
                return translated;
            }
            const direct = t(rawName);
            return direct && direct !== rawName ? direct : rawName;
        }

        if (token.startsWith('distance:')) {
            const num = Number(token.slice('distance:'.length).trim());
            return formatDistance(num);
        }

        if (token.startsWith('time:')) {
            const num = Number(token.slice('time:'.length).trim());
            return formatTime(num);
        }

        const camelCase = token.charAt(0).toLowerCase() + token.slice(1);
        const disciplineKey = `disciplineTypes.${camelCase}`;
        const translated = t(disciplineKey);
        if (translated && translated !== disciplineKey) {
            return translated;
        }
        const directTranslated = t(token);
        if (directTranslated && directTranslated !== token) {
            return directTranslated;
        }
        return token;
    });

    res = res.replace(/\b(\d+)\s*m\b/g, (_, numStr: string) => {
        const m = Number(numStr);
        return formatDistance(m);
    });

    res = res.replace(/\b(\d+)\s*s\b/g, (_, numStr: string) => {
        const s = Number(numStr);
        return formatTime(s);
    });

    return res;
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ł/g, 'l')
        .replace(/Ł/g, 'l')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export function updateTitleWithSlug<T extends { title: string; link: string }>(
    prevForm: T,
    newTitle: string,
    isEdit: boolean,
): T {
    const prevGenerated = slugify(prevForm.title);
    const nextGenerated = slugify(newTitle);
    if (!isEdit && (!prevForm.link || prevForm.link === prevGenerated)) {
        return { ...prevForm, title: newTitle, link: nextGenerated };
    }
    return { ...prevForm, title: newTitle };
}

export function generateUuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
