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
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { formatImageSrc } from '../utils/imageUtils';
import { RunnerLogo } from './RunnerLogo';

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const { t, i18n } = useTranslation();
    const { isAuthenticated, currentUser, logout } = useAuth();
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
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap">
                            {isAuthenticated && (
                                <Burger
                                    opened={drawerOpened}
                                    onClick={toggleDrawer}
                                    hiddenFrom="sm"
                                    size="sm"
                                    aria-label="Toggle navigation"
                                />
                            )}
                            <UnstyledButton className="pointer" onClick={() => handleNav('/')}>
                                <Group gap="xs" wrap="nowrap">
                                    <RunnerLogo size={32} />
                                    <Text fw={700} size="lg" c="var(--mantine-primary-color)">
                                        Sportgram
                                    </Text>
                                </Group>
                            </UnstyledButton>

                            {isAuthenticated && (
                                <Group gap={4} visibleFrom="sm" wrap="nowrap">
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
                                <>
                                    <SegmentedControl
                                        size="xs"
                                        value={i18n.language.startsWith('en') ? 'en' : 'pl'}
                                        onChange={(val) => i18n.changeLanguage(val)}
                                        data={[
                                            { label: 'PL', value: 'pl' },
                                            { label: 'EN', value: 'en' },
                                        ]}
                                    />

                                    <ActionIcon
                                        variant="default"
                                        size={30}
                                        onClick={() => toggleColorScheme()}
                                        aria-label={t('toggleTheme')}
                                    >
                                        {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
                                    </ActionIcon>

                                    <Button variant="default" size="xs" onClick={() => handleNav('/sign')}>
                                        {t('sign')}
                                    </Button>
                                    <Button size="xs" onClick={() => handleNav('/register')}>
                                        {t('register')}
                                    </Button>
                                </>
                            ) : currentUser ? (
                                <Menu shadow="md" width={200} position="bottom-end">
                                    <Menu.Target>
                                        <Button variant="subtle" size="sm" p={4}>
                                            <Group gap="xs" wrap="nowrap">
                                                <Avatar
                                                    src={formatImageSrc(currentUser.profilePhoto)}
                                                    radius={5}
                                                    size="sm"
                                                >
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
                <Container size="lg" w="100%">
                    {children}
                </Container>
            </AppShell.Main>

            {isAuthenticated && (
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
                    <Stack gap="xs" mt="sm">
                        {navItems.map((item) => {
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
                        })}
                    </Stack>
                </Drawer>
            )}
        </AppShell>
    );
}
