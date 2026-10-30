const COLOR_VARS = [
    '--mantine-primary-color-filled',
    '--mantine-primary-color-filled-hover',
    '--mantine-primary-color-light',
    '--mantine-primary-color-light-hover',
    '--mantine-primary-color-light-color',
    '--mantine-primary-color-contrast',
    '--mantine-primary-color-0',
    '--mantine-primary-color-1',
    '--mantine-primary-color-2',
    '--mantine-primary-color-3',
    '--mantine-primary-color-4',
    '--mantine-primary-color-5',
    '--mantine-primary-color-6',
    '--mantine-primary-color-7',
    '--mantine-primary-color-8',
    '--mantine-primary-color-9',
];

export function applyThemeColor(colorName?: string | null) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const color = colorName || 'blue';
    if (!color || color === 'blue') {
        COLOR_VARS.forEach((v) => root.style.removeProperty(v));
        return;
    }
    root.style.setProperty('--mantine-primary-color-filled', `var(--mantine-color-${color}-filled)`);
    root.style.setProperty('--mantine-primary-color-filled-hover', `var(--mantine-color-${color}-filled-hover)`);
    root.style.setProperty('--mantine-primary-color-light', `var(--mantine-color-${color}-light)`);
    root.style.setProperty('--mantine-primary-color-light-hover', `var(--mantine-color-${color}-light-hover)`);
    root.style.setProperty('--mantine-primary-color-light-color', `var(--mantine-color-${color}-light-color)`);
    root.style.setProperty('--mantine-primary-color-contrast', `var(--mantine-color-${color}-contrast)`);
    for (let i = 0; i <= 9; i++) {
        root.style.setProperty(`--mantine-primary-color-${i}`, `var(--mantine-color-${color}-${i})`);
    }
}
