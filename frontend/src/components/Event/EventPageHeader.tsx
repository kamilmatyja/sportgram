import React from 'react';
import { Card, Image, Stack } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { PageResponse } from '../../api/responses/PageResponse';
import { useTranslation } from '../../context/TranslationContext';
import BootstrapIcon from '../Common/BootstrapIcon';

interface EventPageHeaderProps {
    ownerPage: PageResponse;
}

export const EventPageHeader: React.FC<EventPageHeaderProps> = ({ ownerPage }) => {
    const { t } = useTranslation();

    return (
        <Stack gap={3}>
            <Card className="shadow-sm mb-0">
                <Stack className="profile-bg-container bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border rounded-top">
                    {ownerPage.backgroundPhoto && (
                        <Image
                            src={`data:image/webp;base64,${ownerPage.backgroundPhoto}`}
                            alt={t('backgroundPhoto')}
                            className="w-100 h-100 object-fit-cover"
                        />
                    )}
                </Stack>
                <Card.Body className="position-relative pt-5 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
                    <Stack>
                        {ownerPage.profilePhoto ? (
                            <Image
                                src={`data:image/webp;base64,${ownerPage.profilePhoto}`}
                                alt={t('profilePhoto')}
                                className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"
                            />
                        ) : (
                            <Stack className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar align-items-center justify-content-center">
                                <BootstrapIcon name="file-earmark-text" className="fs-1 text-muted" />
                            </Stack>
                        )}
                        <Stack className="mt-4 mt-md-3">
                            <Card.Title as="h2" className="mb-0 profile-theme-text fw-bold">
                                {ownerPage.title}
                            </Card.Title>
                            <Card.Text className="text-muted mb-0">@{ownerPage.link}</Card.Text>
                        </Stack>
                    </Stack>
                </Card.Body>
            </Card>

            <Stack direction="horizontal" className="mb-4">
                <Link to="/events" className="btn btn-profile-outline-primary">
                    <BootstrapIcon name="arrow-left" className="me-1" /> {t('events')}
                </Link>
            </Stack>
        </Stack>
    );
};
