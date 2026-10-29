import React from 'react';
import { Card, Box, Avatar, Text, Title, Image, Group, Tooltip, ActionIcon } from '@mantine/core';
import { IconBuildingStore } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type PageResource } from '../api/services';
import { formatImageSrc } from '../utils/imageUtils';

export interface PageNavProps {
    page?: PageResource | null;
    extraActions?: React.ReactNode;
}

export function PageNav({ page, extraActions }: PageNavProps) {
    const { t } = useTranslation();
    const location = useLocation();

    if (!page) return null;

    const bgSrc = formatImageSrc(page.backgroundPhoto);
    const profileSrc = formatImageSrc(page.profilePhoto);
    const isSamePage = location.pathname === `/pages/${page.link}`;

    return (
        <Box mb="md">
            <Card withBorder radius="md" p={0} mb="sm" shadow="xs" className="overflow-hidden">
                {bgSrc ? (
                    <Image src={bgSrc} h={160} fit="cover" alt={page.title} />
                ) : (
                    <Box h={160} bg="var(--mantine-primary-color-filled)" />
                )}

                <Box p="md" pos="relative">
                    <Avatar
                        src={profileSrc}
                        size={100}
                        radius="md"
                        pos="absolute"
                        top={-50}
                        left={24}
                        className="profile-avatar-border"
                        component={Link}
                        to={`/pages/${page.link}`}
                    >
                        ?
                    </Avatar>

                    <Group justify="space-between" align="flex-start" mt={55}>
                        <div>
                            <Link to={`/pages/${page.link}`} className="no-decoration">
                                <Title order={2}>{page.title}</Title>
                            </Link>
                            <Text size="sm" c="dimmed">
                                @{page.link}
                            </Text>
                        </div>

                        <Group gap="xs">
                            {!isSamePage && (
                                <Tooltip label={t('details')} withArrow>
                                    <ActionIcon
                                        component={Link}
                                        to={`/pages/${page.link}`}
                                        variant="light"
                                        size={30}
                                        aria-label={t('details')}
                                    >
                                        <IconBuildingStore size={16} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                            {extraActions}
                        </Group>
                    </Group>
                </Box>
            </Card>
        </Box>
    );
}

export default PageNav;
