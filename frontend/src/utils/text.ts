export function truncate(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatFeedOrigin(origin: string | null | undefined, t: (key: string) => string): string {
    if (!origin) return '';
    return origin.replace(/\{([^}]+)\}/g, (_, token: string) => {
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
