import React from 'react';
import { Card, Box, Avatar, Text, Title, Image, Group, Button, Center, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconBookmark } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type PageResource } from '../api/services';
import { PageFollowStatusEnum } from '../enums/PageFollowStatusEnum';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { EntityViewCounter } from './EntityViewCounter';
import { formatImageSrc } from '../utils/imageUtils';

export interface PageNavProps {
    page?: PageResource | null;
    extraActions?: React.ReactNode;
    simplifiedHeader?: boolean;
}

export function PageNav({ page, extraActions, simplifiedHeader = false }: PageNavProps) {
    const { t } = useTranslation();
    const location = useLocation();

    if (!page) return null;

    const bgSrc = formatImageSrc(page.backgroundPhoto);
    const profileSrc = formatImageSrc(page.profilePhoto);
    const isSamePage = location.pathname === `/pages/${page.link}`;

    return (
        <Box mb="md">
            <Card withBorder radius={5} p={0} mb="sm" shadow="xs" className="overflow-hidden">
                {bgSrc ? (
                    <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                        <Center pos="absolute" inset={0} className="header-bg-placeholder-center">
                            <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                                ?
                            </Text>
                        </Center>
                        <Image
                            className="header-bg-image"
                            src={bgSrc}
                            h={160}
                            w="100%"
                            fit="cover"
                            alt={page.title}
                            pos="relative"
                            onError={(e) => {
                                e.currentTarget.classList.add('d-none');
                            }}
                        />
                    </Box>
                ) : (
                    <Center h={160} bg="var(--mantine-primary-color-filled)">
                        <Text fz={48} fw={700} c="white" className="header-bg-placeholder-text">
                            ?
                        </Text>
                    </Center>
                )}

                <Box p="md" pos="relative" className="header-content-box">
                    <Avatar
                        src={profileSrc}
                        size={100}
                        radius={5}
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
                            <Group gap="xs" align="center" mt={2}>
                                <Text size="sm" c="dimmed">
                                    @{page.link}
                                </Text>
                                {!simplifiedHeader && (
                                    <>
                                        <Text size="sm" c="dimmed">
                                            •
                                        </Text>
                                        <EntityViewCounter
                                            entityId={page.id}
                                            type={EntryTypeEnum.PAGE}
                                            track={isSamePage}
                                        />
                                        <Text size="sm" c="dimmed">
                                            •
                                        </Text>
                                        <Tooltip label={t('followers')} withArrow>
                                            <Group gap={4} align="center" c="dimmed">
                                                <IconBookmark size={16} />
                                                <Text size="sm" c="dimmed">
                                                    {
                                                        (page.follows ?? []).filter(
                                                            (f) => f.status === PageFollowStatusEnum.ACCEPTED,
                                                        ).length
                                                    }
                                                </Text>
                                            </Group>
                                        </Tooltip>
                                    </>
                                )}
                            </Group>
                        </div>

                        <Group gap="xs">
                            {!isSamePage && (
                                <Button
                                    component={Link}
                                    to={`/pages/${page.link}`}
                                    variant="light"
                                    size="xs"
                                    leftSection={<IconArrowLeft size={16} />}
                                >
                                    {t('backToPage')}
                                </Button>
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
