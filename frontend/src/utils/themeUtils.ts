const THEME_SHADES = ['filled', 'filled-hover', 'light', 'light-hover', 'light-color', 'contrast'] as const;

export function applyThemeColor(colorName?: string | null) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const color = colorName || 'blue';
    const isDefault = !color || color === 'blue';

    const setOrRemove = (prop: string, val: string) => {
        if (isDefault) {
            root.style.removeProperty(prop);
        } else {
            root.style.setProperty(prop, val);
        }
    };

    THEME_SHADES.forEach((shade) =>
        setOrRemove(`--mantine-primary-color-${shade}`, `var(--mantine-color-${color}-${shade})`),
    );

    for (let i = 0; i <= 9; i++) {
        setOrRemove(`--mantine-primary-color-${i}`, `var(--mantine-color-${color}-${i})`);
    }
}
