import {
    createTheme,
    Table,
    TableScrollContainer,
    Avatar,
    Card,
    Paper,
    Modal,
    ModalRoot,
    ModalContent,
    Drawer,
    DrawerContent,
    CloseButton,
    Badge,
    ActionIcon,
    Tooltip,
    Menu,
    Image,
    Container,
    SimpleGrid,
    Stack,
    Group,
    Skeleton,
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
        Container: Container.extend({
            defaultProps: {
                size: 'lg',
            },
        }),
        SimpleGrid: SimpleGrid.extend({
            defaultProps: {
                cols: { base: 1, sm: 2 },
                spacing: 'sm',
            },
        }),
        Stack: Stack.extend({
            defaultProps: {
                gap: 'md',
            },
        }),
        Group: Group.extend({
            defaultProps: {
                gap: 'sm',
            },
        }),
        Skeleton: Skeleton.extend({
            defaultProps: {
                radius: 'sm',
            },
        }),
        Table: Table.extend({
            defaultProps: {
                striped: true,
                highlightOnHover: true,
                withTableBorder: true,
                withColumnBorders: true,
                withRowBorders: true,
                verticalSpacing: 'sm',
            },
        }),
        TableScrollContainer: TableScrollContainer.extend({
            defaultProps: {
                minWidth: 600,
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
                p: 'md',
            },
        }),
        Modal: Modal.extend({
            defaultProps: {
                size: 'lg',
            },
            styles: {
                content: {
                    padding: 0,
                },
                header: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'var(--mantine-color-body)',
                },
            },
        }),
        ModalRoot: ModalRoot.extend({
            defaultProps: {
                size: 'lg',
            },
            styles: {
                content: {
                    padding: 0,
                },
                header: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: 'var(--mantine-color-body)',
                },
            },
        }),
        ModalContent: ModalContent.extend({
            defaultProps: {
                p: 0,
            },
        }),
        Drawer: Drawer.extend({
            styles: {
                content: {
                    padding: 0,
                },
            },
        }),
        DrawerContent: DrawerContent.extend({
            defaultProps: {
                p: 0,
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
                size: 'sm',
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
                fit: 'cover',
            },
        }),
    },
});
