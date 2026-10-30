import React from 'react';
import { Card, Box, Avatar, Text, Title, Image, Group, Button, Center } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
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
            <Card withBorder radius={5} p={0} mb="sm" shadow="xs" className="overflow-hidden">
                {bgSrc ? (
                    <Box h={160} pos="relative" bg="var(--mantine-primary-color-filled)">
                        <Center pos="absolute" inset={0} style={{ zIndex: 0 }}>
                            <Text fz={48} fw={700} c="white" style={{ opacity: 0.8, userSelect: 'none' }}>
                                ?
                            </Text>
                        </Center>
                        <Image
                            src={bgSrc}
                            h={160}
                            w="100%"
                            fit="cover"
                            alt={page.title}
                            pos="relative"
                            style={{ zIndex: 1 }}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </Box>
                ) : (
                    <Center h={160} bg="var(--mantine-primary-color-filled)">
                        <Text fz={48} fw={700} c="white" style={{ opacity: 0.8, userSelect: 'none' }}>
                            ?
                        </Text>
                    </Center>
                )}

                <Box p="md" pos="relative">
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
                            <Text size="sm" c="dimmed">
                                @{page.link}
                            </Text>
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
