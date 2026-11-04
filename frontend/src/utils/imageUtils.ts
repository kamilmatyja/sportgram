export const formatImageSrc = (src?: string | null): string | undefined => {
    if (!src || !src.trim()) return undefined;
    let trimmed = src.trim();
    if (trimmed.startsWith('\\/')) {
        trimmed = trimmed.replace(/^\\+/, '');
    }

    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }

    if (
        trimmed.startsWith('/') &&
        !trimmed.startsWith('/9j') &&
        (trimmed.includes('.png') ||
            trimmed.includes('.jpg') ||
            trimmed.includes('.jpeg') ||
            trimmed.includes('.svg') ||
            trimmed.includes('.webp') ||
            trimmed.includes('.gif') ||
            trimmed.length < 100)
    ) {
        return trimmed;
    }

    let mime = 'image/jpeg';
    if (trimmed.startsWith('iVBORw0KGgo')) {
        mime = 'image/png';
    } else if (trimmed.startsWith('R0lGOD')) {
        mime = 'image/gif';
    } else if (trimmed.startsWith('UklGR')) {
        mime = 'image/webp';
    } else if (trimmed.startsWith('/9j')) {
        mime = 'image/jpeg';
    } else if (trimmed.startsWith('PHN2Zy') || trimmed.startsWith('PD94bW')) {
        mime = 'image/svg+xml';
    }
    return `data:${mime};base64,${trimmed}`;
};

export const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const commaIndex = result.indexOf(',');
            if (commaIndex !== -1) {
                resolve(result.slice(commaIndex + 1));
            } else {
                resolve(result);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
