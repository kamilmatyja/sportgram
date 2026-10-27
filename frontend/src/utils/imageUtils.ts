export const formatImageSrc = (src?: string | null): string | undefined => {
    if (!src || !src.trim()) return undefined;
    const trimmed = src.trim();
    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('/') ||
        trimmed.startsWith('blob:')
    ) {
        return trimmed;
    }
    // Pure base64 string from backend - detect MIME type from magic base64 prefix
    let mime = 'image/jpeg';
    if (trimmed.startsWith('iVBORw0KGgo')) {
        mime = 'image/png';
    } else if (trimmed.startsWith('R0lGOD')) {
        mime = 'image/gif';
    } else if (trimmed.startsWith('UklGR')) {
        mime = 'image/webp';
    } else if (trimmed.startsWith('/9j/')) {
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
