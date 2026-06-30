import React from 'react';
import { Card, Image, Stack, Button, Spinner } from 'react-bootstrap';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import BootstrapIcon from '../Common/BootstrapIcon';

interface PageHeaderProps {
    pageObj: PageResponse;
    isFollowing: boolean;
    followLoading: boolean;
    handleToggleFollow: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ pageObj, isFollowing, followLoading, handleToggleFollow }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm mb-4 border-0">
            <Stack className="profile-bg-container bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border rounded-top">
                {pageObj.backgroundPhoto && (
                    <Image
                        src={`data:image/webp;base64,${pageObj.backgroundPhoto}`}
                        alt={t('backgroundPhoto')}
                        className="w-100 h-100 object-fit-cover"
                    />
                )}
            </Stack>
            <Card.Body className="position-relative pt-5">
                <Stack>
                    {pageObj.profilePhoto ? (
                        <Image
                            src={`data:image/webp;base64,${pageObj.profilePhoto}`}
                            alt={t('profilePhoto')}
                            className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"
                        />
                    ) : (
                        <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                            <BootstrapIcon name="file-earmark-text" className="fs-1 text-muted" />
                        </Stack>
                    )}
                    <Stack
                        direction="horizontal"
                        className="mt-4 mt-md-3 justify-content-between align-items-start gap-3"
                    >
                        <Stack>
                            <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">
                                {pageObj.title}
                            </Card.Title>
                            <Card.Text className="text-muted mb-0">@{pageObj.link}</Card.Text>
                        </Stack>
                        <Button
                            variant={isFollowing ? 'outline-danger' : 'profile-primary'}
                            size="sm"
                            onClick={handleToggleFollow}
                            disabled={followLoading}
                            className="flex-shrink-0"
                        >
                            {followLoading ? (
                                <Spinner animation="border" size="sm" />
                            ) : (
                                <>
                                    <BootstrapIcon
                                        name={isFollowing ? 'dash-circle' : 'plus-circle'}
                                        className="me-1"
                                    />
                                    {t(isFollowing ? 'unfollowPage' : 'followPage')}
                                </>
                            )}
                        </Button>
                    </Stack>
                </Stack>
            </Card.Body>
        </Card>
    );
};
