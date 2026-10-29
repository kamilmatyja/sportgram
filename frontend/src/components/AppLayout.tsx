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
} from '@mantine/core';
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

    const handleNav = (path: string) => {
        navigate(path);
    };

    const userLink = currentUser?.link ?? '';

    const navItems = [
        { path: '/users', label: t('navUsers'), icon: <IconUsers size={16} /> },
        { path: '/pages', label: t('navPages'), icon: <IconBuildingStore size={16} /> },
        { path: '/events', label: t('navEvents'), icon: <IconCalendarEvent size={16} /> },
        { path: '/statistics', label: t('navStatistics'), icon: <IconChartBar size={16} /> },
    ];

    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Container size="lg" h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        {/* Left: Brand + Navigation links */}
                        <Group gap="lg" wrap="nowrap">
                            <UnstyledButton className="pointer" onClick={() => handleNav('/')}>
                                <Group gap="xs" wrap="nowrap">
                                    <RunnerLogo size={32} />
                                    <Text fw={700} size="lg" c="blue.5">
                                        Sportgram
                                    </Text>
                                </Group>
                            </UnstyledButton>

                            {isAuthenticated && (
                                <Group gap={4} visibleFrom="sm" wrap="nowrap">
                                    {navItems.map((item) => {
                                        const isActive =
                                            item.path === '/users'
                                                ? location.pathname === '/users'
                                                : location.pathname.startsWith(item.path);
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

                        {/* Right: User menu OR guest controls */}
                        <Group gap="xs" wrap="nowrap">
                            {!isAuthenticated ? (
                                <>
                                    {/* Language toggle for guest */}
                                    <SegmentedControl
                                        size="xs"
                                        value={i18n.language.startsWith('en') ? 'en' : 'pl'}
                                        onChange={(val) => i18n.changeLanguage(val)}
                                        data={[
                                            { label: 'PL', value: 'pl' },
                                            { label: 'EN', value: 'en' },
                                        ]}
                                    />

                                    {/* Dark / Light toggle for guest */}
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
                                                    radius="xl"
                                                    size="sm"
                                                    color="blue"
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
        </AppShell>
    );
}
