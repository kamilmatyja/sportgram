const BASE64_MIME_PREFIXES: [string, string][] = [
    ['iVBORw0KGgo', 'image/png'],
    ['R0lGOD', 'image/gif'],
    ['UklGR', 'image/webp'],
    ['/9j', 'image/jpeg'],
    ['PHN2Zy', 'image/svg+xml'],
    ['PD94bW', 'image/svg+xml'],
];

export const formatImageSrc = (src?: string | null): string | undefined => {
    if (!src?.trim()) return undefined;
    const trimmed = src.trim().replace(/^\\+/, '');

    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:') ||
        (trimmed.startsWith('/') && !trimmed.startsWith('/9j'))
    ) {
        return trimmed;
    }

    const matched = BASE64_MIME_PREFIXES.find(([prefix]) => trimmed.startsWith(prefix));
    const mime = matched ? matched[1] : 'image/jpeg';
    return `data:${mime};base64,${trimmed}`;
};

export const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

export const resolveImageBase64 = async (
    newFile: File | null | undefined,
    existingValue?: string | null,
    requiredErrorMessage?: string,
): Promise<string> => {
    if (newFile) {
        return await fileToBase64(newFile);
    }
    if (existingValue) {
        return existingValue;
    }
    if (requiredErrorMessage) {
        throw new Error(requiredErrorMessage);
    }
    return '';
};
