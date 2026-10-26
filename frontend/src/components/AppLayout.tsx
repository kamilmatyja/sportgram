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
import { IconSun, IconMoon, IconLogout, IconUser } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
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
        { path: '/', label: t('navHome') },
        { path: '/users', label: t('navUsers') },
        { path: '/pages', label: t('navPages') },
        { path: '/events', label: t('navEvents') },
        { path: '/statistics', label: t('navStatistics') },
    ];

    return (
        <AppShell header={{ height: 60 }} padding="md">
            <AppShell.Header>
                <Container size="xl" h="100%">
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
                                            item.path === '/'
                                                ? location.pathname === '/'
                                                : location.pathname.startsWith(item.path);
                                        return (
                                            <Button
                                                key={item.path}
                                                variant={isActive ? 'light' : 'subtle'}
                                                size="xs"
                                                onClick={() => handleNav(item.path)}
                                            >
                                                {item.label}
                                            </Button>
                                        );
                                    })}
                                    {userLink && (
                                        <Button
                                            variant={location.pathname === `/users/${userLink}` ? 'light' : 'subtle'}
                                            size="xs"
                                            onClick={() => handleNav(`/users/${userLink}`)}
                                        >
                                            {t('navProfile')}
                                        </Button>
                                    )}
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
                                        size="lg"
                                        onClick={() => toggleColorScheme()}
                                        aria-label={t('toggleTheme')}
                                    >
                                        {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
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
                                                    src={currentUser.profilePhoto || undefined}
                                                    radius="xl"
                                                    size="sm"
                                                    color="blue"
                                                >
                                                    {currentUser.firstName?.[0]}
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
                <Container size="xl">{children}</Container>
            </AppShell.Main>
        </AppShell>
    );
}
