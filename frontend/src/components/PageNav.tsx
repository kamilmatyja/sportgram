import { Box, Text, Title, Group, Button, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconBookmark } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type PageResource } from '../api/services';
import { PageFollowStatusEnum } from '../enums/PageFollowStatusEnum';
import { EntryTypeEnum } from '../enums/EntryTypeEnum';
import { EntityViewCounter } from './EntityViewCounter';
import { formatImageSrc } from '../utils/imageUtils';
import { HeaderBannerWithAvatar } from './common/HeaderBannerWithAvatar';

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
            <HeaderBannerWithAvatar backgroundPhotoSrc={bgSrc} profilePhotoSrc={profileSrc} altText={page.title}>
                <Group justify="space-between" align="flex-start" mt={55}>
                    <div>
                        <Title order={2}>{page.title}</Title>
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
            </HeaderBannerWithAvatar>
        </Box>
    );
}

export default PageNav;
