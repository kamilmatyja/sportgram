import { type ReactNode } from 'react';
import {
    AppShell,
    Group,
    Button,
    ActionIcon,
    useMantineColorScheme,
    Menu,
    Avatar,
    Text,
    Container,
    SegmentedControl,
    UnstyledButton,
    Burger,
    Drawer,
    Stack,
    Divider,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconSun,
    IconMoon,
    IconLogout,
    IconUser,
    IconUsers,
    IconBuildingStore,
    IconCalendarEvent,
    IconChartBar,
    IconLogin,
    IconUserPlus,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { formatImageSrc } from '../utils';
import { RunnerLogo } from './RunnerLogo';
import { OfflineStatusBadge } from './common/OfflineStatusBadge';
import { useInteractionAttributes } from './common/InteractionModal';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const { t, i18n } = useTranslation();
    const { isAuthenticated, currentUser, logout } = useAuth();
    const navigationAttributes = useInteractionAttributes('navigation');
    const pageAttributes = useInteractionAttributes('page');
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] = useDisclosure(false);

    const handleNav = (path: string) => {
        navigate(path);
    };

    const userLink = currentUser?.link ?? '';

    const navItems = [
        { path: '/users', label: t('users'), icon: <IconUsers size={16} /> },
        { path: '/pages', label: t('pages'), icon: <IconBuildingStore size={16} /> },
        { path: '/events', label: t('events'), icon: <IconCalendarEvent size={16} /> },
        { path: '/statistics', label: t('statistics'), icon: <IconChartBar size={16} /> },
    ];

    return (
        <AppShell>
            <AppShell.Header {...navigationAttributes}>
                <Container h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Group wrap="nowrap">
                            <Burger
                                opened={drawerOpened}
                                onClick={toggleDrawer}
                                hiddenFrom="sm"
                                size="sm"
                                aria-label="Toggle navigation"
                            />
                            <UnstyledButton onClick={() => handleNav('/')}>
                                <Group gap="xs" wrap="nowrap">
                                    <RunnerLogo size={32} />
                                    <Text fw={700} size="lg" c="var(--mantine-primary-color)">
                                        Sportgram
                                    </Text>
                                </Group>
                            </UnstyledButton>

                            <OfflineStatusBadge />

                            {isAuthenticated && (
                                <Group gap="xs" visibleFrom="sm" wrap="nowrap">
                                    {navItems.map((item) => {
                                        const isActive = location.pathname === item.path;
                                        return (
                                            <Button
                                                key={item.path}
                                                variant={isActive ? 'light' : 'subtle'}
                                                size="xs"
                                                leftSection={item.icon}
                                                onClick={() => handleNav(item.path)}
                                            >
                                                {item.label}
                                            </Button>
                                        );
                                    })}
                                </Group>
                            )}
                        </Group>

                        <Group gap="xs" wrap="nowrap">
                            {!isAuthenticated ? (
                                <Group gap="xs" wrap="nowrap" visibleFrom="sm">
                                    <SegmentedControl
                                        size="xs"
                                        value={i18n.language.startsWith('en') ? 'en' : 'pl'}
                                        onChange={(val) => i18n.changeLanguage(val)}
                                        data={[
                                            { label: 'PL', value: 'pl' },
                                            { label: 'EN', value: 'en' },
                                        ]}
                                    />

                                    <Tooltip label={t('toggleTheme')}>
                                        <ActionIcon
                                            variant="default"
                                            onClick={() => toggleColorScheme()}
                                            aria-label={t('toggleTheme')}
                                        >
                                            {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                                        </ActionIcon>
                                    </Tooltip>

                                    <Button variant="default" size="xs" onClick={() => handleNav('/sign')}>
                                        {t('sign')}
                                    </Button>
                                    <Button size="xs" onClick={() => handleNav('/register')}>
                                        {t('register')}
                                    </Button>
                                </Group>
                            ) : currentUser ? (
                                <Menu width={200}>
                                    <Menu.Target>
                                        <Button variant="subtle" size="sm" p={4}>
                                            <Group gap="xs" wrap="nowrap">
                                                <Avatar src={formatImageSrc(currentUser.profilePhoto)} size="sm">
                                                    ?
                                                </Avatar>
                                                <Text size="sm" visibleFrom="xs" fw={500}>
                                                    {currentUser.firstName} {currentUser.lastName}
                                                </Text>
                                            </Group>
                                        </Button>
                                    </Menu.Target>

                                    <Menu.Dropdown>
                                        <Menu.Item
                                            leftSection={<IconUser size={16} />}
                                            onClick={() => handleNav(`/users/${userLink}`)}
                                        >
                                            {t('profile')}
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                                            {t('logout')}
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            ) : null}
                        </Group>
                    </Group>
                </Container>
            </AppShell.Header>

            <AppShell.Main>
                <Container w="100%">
                    <div id="profile-navigation-root" />
                    <div {...pageAttributes}>{children}</div>
                </Container>
            </AppShell.Main>

            <Drawer
                opened={drawerOpened}
                onClose={closeDrawer}
                size="xs"
                title={
                    <Group gap="xs">
                        <RunnerLogo size={24} />
                        <Text fw={700} size="md" c="var(--mantine-primary-color)">
                            Sportgram
                        </Text>
                    </Group>
                }
                hiddenFrom="sm"
            >
                <Stack gap="xs" mt="sm" {...navigationAttributes}>
                    <OfflineStatusBadge fullWidth />
                    {isAuthenticated ? (
                        navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Button
                                    key={item.path}
                                    variant={isActive ? 'light' : 'subtle'}
                                    justify="flex-start"
                                    leftSection={item.icon}
                                    onClick={() => {
                                        handleNav(item.path);
                                        closeDrawer();
                                    }}
                                >
                                    {item.label}
                                </Button>
                            );
                        })
                    ) : (
                        <>
                            <Button
                                variant={location.pathname === '/sign' ? 'light' : 'default'}
                                justify="flex-start"
                                leftSection={<IconLogin size={16} />}
                                onClick={() => {
                                    handleNav('/sign');
                                    closeDrawer();
                                }}
                            >
                                {t('sign')}
                            </Button>
                            <Button
                                variant={location.pathname === '/register' ? 'light' : 'filled'}
                                justify="flex-start"
                                leftSection={<IconUserPlus size={16} />}
                                onClick={() => {
                                    handleNav('/register');
                                    closeDrawer();
                                }}
                            >
                                {t('register')}
                            </Button>
                            <Divider my="xs" />
                            <Group justify="space-between" px="xs">
                                <Text size="sm">{t('language')}</Text>
                                <SegmentedControl
                                    size="xs"
                                    value={i18n.language.startsWith('en') ? 'en' : 'pl'}
                                    onChange={(val) => i18n.changeLanguage(val)}
                                    data={[
                                        { label: 'PL', value: 'pl' },
                                        { label: 'EN', value: 'en' },
                                    ]}
                                />
                            </Group>
                            <Group justify="space-between" px="xs">
                                <Text size="sm">{t('theme')}</Text>
                                <ActionIcon
                                    variant="default"
                                    onClick={() => toggleColorScheme()}
                                    aria-label={t('toggleTheme')}
                                >
                                    {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                                </ActionIcon>
                            </Group>
                        </>
                    )}
                </Stack>
            </Drawer>
        </AppShell>
    );
}
