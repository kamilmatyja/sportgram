export function truncate(text: string | null | undefined, maxLength: number = 50): string {
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatFeedOrigin(origin: string | null | undefined, t: (key: string) => string): string {
    if (!origin) return '';
    return origin.replace(/\{([^}]+)\}/g, (_, token: string) => {
        const snakeCase = token.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
        const disciplineKey = `disciplines.${snakeCase}`;
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
