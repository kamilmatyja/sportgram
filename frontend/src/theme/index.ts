import {
    createTheme,
    Table,
    Avatar,
    Card,
    Paper,
    Modal,
    ModalRoot,
    CloseButton,
    Badge,
    ActionIcon,
    Tooltip,
    Menu,
    Image,
    type MantineColorsTuple,
} from '@mantine/core';

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
    defaultRadius: 'sm',
    fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    components: {
        Table: Table.extend({
            defaultProps: {
                striped: true,
                highlightOnHover: true,
                withTableBorder: true,
                withColumnBorders: true,
                withRowBorders: true,
            },
        }),
        Avatar: Avatar.extend({
            defaultProps: {
                radius: 'sm',
                size: 'md',
            },
        }),
        Card: Card.extend({
            defaultProps: {
                radius: 'sm',
                withBorder: true,
                shadow: 'xs',
                padding: 'md',
            },
        }),
        Paper: Paper.extend({
            defaultProps: {
                radius: 'sm',
                withBorder: true,
                shadow: 'xs',
            },
        }),
        Modal: Modal.extend({
            defaultProps: {
                size: 'lg',
            },
        }),
        ModalRoot: ModalRoot.extend({
            defaultProps: {
                size: 'lg',
            },
        }),
        CloseButton: CloseButton.extend({
            defaultProps: {
                size: 30,
            },
        }),
        Badge: Badge.extend({
            defaultProps: {
                variant: 'light',
            },
        }),
        ActionIcon: ActionIcon.extend({
            defaultProps: {
                variant: 'light',
                size: 30,
            },
        }),
        Tooltip: Tooltip.extend({
            defaultProps: {
                withArrow: true,
            },
        }),
        Menu: Menu.extend({
            defaultProps: {
                shadow: 'md',
                position: 'bottom-end',
            },
        }),
        Image: Image.extend({
            defaultProps: {
                radius: 'sm',
            },
        }),
    },
});
