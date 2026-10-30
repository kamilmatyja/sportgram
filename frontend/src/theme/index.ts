import { createTheme, type MantineColorsTuple } from '@mantine/core';

export const brown: MantineColorsTuple = [
    '#f7f3f0',
    '#ebe2da',
    '#d7c3b2',
    '#c2a288',
    '#b08664',
    '#a5744c',
    '#a06c40',
    '#8b5c33',
    '#7c512b',
    '#6d4422',
];

export const theme = createTheme({
    primaryColor: 'blue',
    colors: {
        brown,
    },
    defaultRadius: 'md',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
});
